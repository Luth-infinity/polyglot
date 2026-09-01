//! Shared Anthropic API client: one pooled HTTP client, byte-safe SSE parsing,
//! retry on transient errors, and human-readable error messages.

use futures::StreamExt;
use serde::Deserialize;
use std::sync::OnceLock;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub const MODEL: &str = "claude-haiku-4-5-20251001";

/// Reusing one client keeps the TLS session + connection pool alive, which
/// removes a full handshake (~150-300 ms) from every request after the first.
static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn client() -> &'static reqwest::Client {
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            // Time to first byte only - the stream itself can take as long as it needs.
            .connect_timeout(Duration::from_secs(10))
            .read_timeout(Duration::from_secs(60))
            .pool_idle_timeout(Duration::from_secs(90))
            .build()
            .expect("failed to build HTTP client")
    })
}

// -- SSE payload shapes ------------------------------------------------------

#[derive(Deserialize)]
struct SseDelta {
    #[serde(rename = "type")]
    type_: Option<String>,
    text: Option<String>,
    stop_reason: Option<String>,
}

#[derive(Deserialize)]
struct SseData {
    #[serde(rename = "type")]
    type_: String,
    delta: Option<SseDelta>,
    error: Option<ApiErrorBody>,
}

#[derive(Deserialize)]
struct ApiErrorBody {
    #[serde(rename = "type")]
    type_: Option<String>,
    message: Option<String>,
}

#[derive(Deserialize)]
struct ApiErrorEnvelope {
    error: Option<ApiErrorBody>,
}

/// Turns an API error payload into something worth showing in the UI.
fn friendly_error(status: u16, body: &str) -> String {
    let parsed: Option<ApiErrorEnvelope> = serde_json::from_str(body).ok();
    let kind = parsed
        .as_ref()
        .and_then(|e| e.error.as_ref())
        .and_then(|e| e.type_.as_deref())
        .unwrap_or("");
    let message = parsed
        .as_ref()
        .and_then(|e| e.error.as_ref())
        .and_then(|e| e.message.as_deref())
        .unwrap_or(body);

    match (status, kind) {
        (401, _) | (_, "authentication_error") => {
            "Invalid API key - check it in Settings.".to_string()
        }
        (403, _) | (_, "permission_error") => {
            "This API key is not allowed to use this model.".to_string()
        }
        (400, _) => format!("Bad request: {message}"),
        (429, _) | (_, "rate_limit_error") => {
            "Rate limited by the API - wait a few seconds and retry.".to_string()
        }
        (529, _) | (_, "overloaded_error") => {
            "The API is overloaded right now - retry in a moment.".to_string()
        }
        (s, _) if s >= 500 => format!("API server error ({s}). Retry in a moment."),
        _ => message.to_string(),
    }
}

fn is_retryable(status: u16) -> bool {
    status == 429 || status == 529 || (500..600).contains(&status)
}

// -- Request -----------------------------------------------------------------

pub struct StreamRequest {
    pub api_key: String,
    pub system: String,
    pub user_content: String,
    /// Pre-filled start of the assistant turn. Forces the model straight into
    /// the output format instead of letting it open with a conversational reply.
    pub prefill: Option<String>,
    /// Emit the prefill to the frontend as the first chunk (needed when the
    /// prefill is part of the payload, e.g. the leading `{` of a JSON object).
    pub echo_prefill: bool,
    pub stop_sequences: Vec<String>,
    pub max_tokens: u32,
    pub stream_event: String,
}

/// Streams one message and emits `{stream_event}` / `-done` / `-error` events.
pub async fn stream_message(app: &AppHandle, req: StreamRequest) -> Result<(), String> {
    if req.api_key.trim().is_empty() {
        let msg = "No API key configured - open Settings to add your Claude API key.".to_string();
        let _ = app.emit(&format!("{}-error", req.stream_event), &msg);
        return Err(msg);
    }

    let mut messages = vec![serde_json::json!({
        "role": "user",
        "content": req.user_content,
    })];
    if let Some(prefill) = &req.prefill {
        messages.push(serde_json::json!({
            "role": "assistant",
            "content": prefill,
        }));
    }

    let mut body = serde_json::json!({
        "model": MODEL,
        "max_tokens": req.max_tokens,
        // Translation and proofreading are deterministic tasks - sampling only
        // adds a chance of the model going off-script.
        "temperature": 0,
        "system": req.system,
        "messages": messages,
        "stream": true,
    });
    if !req.stop_sequences.is_empty() {
        body["stop_sequences"] = serde_json::json!(req.stop_sequences);
    }

    // Retry only while nothing has been streamed yet - never replay a partial answer.
    let mut attempt = 0u32;
    let response = loop {
        let result = client()
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &req.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await;

        match result {
            Ok(resp) if resp.status().is_success() => break resp,
            Ok(resp) => {
                let status = resp.status().as_u16();
                let raw = resp.text().await.unwrap_or_default();
                if is_retryable(status) && attempt < 2 {
                    attempt += 1;
                    tokio::time::sleep(Duration::from_millis(400 * 2u64.pow(attempt))).await;
                    continue;
                }
                let msg = friendly_error(status, &raw);
                let _ = app.emit(&format!("{}-error", req.stream_event), &msg);
                return Err(msg);
            }
            Err(e) => {
                if (e.is_connect() || e.is_timeout()) && attempt < 2 {
                    attempt += 1;
                    tokio::time::sleep(Duration::from_millis(400 * 2u64.pow(attempt))).await;
                    continue;
                }
                let msg = if e.is_connect() || e.is_timeout() {
                    "Network unreachable - check your connection.".to_string()
                } else {
                    e.to_string()
                };
                let _ = app.emit(&format!("{}-error", req.stream_event), &msg);
                return Err(msg);
            }
        }
    };

    if req.echo_prefill {
        if let Some(prefill) = &req.prefill {
            let _ = app.emit(&req.stream_event, prefill.clone());
        }
    }

    let mut stream = response.bytes_stream();
    // Buffer BYTES, not a String: a chunk boundary can fall in the middle of a
    // multi-byte UTF-8 character, and decoding per-chunk turns "e-acute" into U+FFFD.
    let mut buffer: Vec<u8> = Vec::with_capacity(8192);
    let mut emitted_any = false;
    let mut truncated = false;

    while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
            Ok(c) => c,
            Err(e) => {
                let msg = format!("Stream interrupted: {e}");
                let _ = app.emit(&format!("{}-error", req.stream_event), &msg);
                return Err(msg);
            }
        };
        buffer.extend_from_slice(&chunk);

        let mut start = 0usize;
        while let Some(rel) = buffer[start..].iter().position(|&b| b == b'\n') {
            let end = start + rel;
            // A full SSE line is always valid UTF-8 on its own.
            let raw_line = String::from_utf8_lossy(&buffer[start..end]);
            let line = raw_line.trim();
            start = end + 1;

            let Some(data) = line.strip_prefix("data: ") else {
                continue;
            };
            let Ok(parsed) = serde_json::from_str::<SseData>(data) else {
                continue;
            };

            match parsed.type_.as_str() {
                "content_block_delta" => {
                    if let Some(delta) = parsed.delta {
                        if delta.type_.as_deref() == Some("text_delta") {
                            if let Some(mut text) = delta.text {
                                // The model often opens with a newline right after
                                // a prefill tag; never let that leak into the output.
                                if !emitted_any {
                                    text = text.trim_start().to_string();
                                    if text.is_empty() {
                                        continue;
                                    }
                                }
                                emitted_any = true;
                                let _ = app.emit(&req.stream_event, text);
                            }
                        }
                    }
                }
                "message_delta" => {
                    if let Some(delta) = parsed.delta {
                        if delta.stop_reason.as_deref() == Some("max_tokens") {
                            truncated = true;
                        }
                    }
                }
                "error" => {
                    let msg = parsed
                        .error
                        .and_then(|e| e.message)
                        .unwrap_or_else(|| "Stream error".to_string());
                    let _ = app.emit(&format!("{}-error", req.stream_event), &msg);
                    return Err(msg);
                }
                _ => {}
            }
        }
        buffer.drain(..start);
    }

    if truncated {
        let _ = app.emit(
            &format!("{}-truncated", req.stream_event),
            "Output was cut off - the text is too long for a single pass.",
        );
    }

    let _ = app.emit(&format!("{}-done", req.stream_event), ());
    Ok(())
}

/// Output budget scaled to the input. Translations and rewrites can legitimately
/// be longer than the source (German, JSON change lists...), so leave headroom.
pub fn max_tokens_for(text: &str, factor: u32) -> u32 {
    let estimated_input = (text.chars().count() as u32) / 3 + 256;
    (estimated_input * factor).clamp(1024, 16384)
}
