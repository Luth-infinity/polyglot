import { ArrowDownToLine, Loader2, RotateCw, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdater } from "@/hooks/useUpdater";
import { useUpdateStore } from "@/store/updateStore";
import { cn } from "@/lib/utils";

/**
 * Only appears when there is something to do. Idle, checking and up-to-date
 * states live in Settings — the title bar is not a status console.
 */
export function UpdateBadge() {
  const status = useUpdateStore((s) => s.status);
  const version = useUpdateStore((s) => s.version);
  const progress = useUpdateStore((s) => s.progress);
  const dismissed = useUpdateStore((s) => s.dismissed);
  const { install, restart } = useUpdater();

  const visible =
    !dismissed && (status === "available" || status === "downloading" || status === "ready");
  if (!visible) return null;

  const { icon, label, tooltip, onClick } = {
    available: {
      icon: <Sparkles className="size-3" />,
      label: `v${version}`,
      tooltip: `Polyglot ${version} is available — click to install`,
      onClick: install,
    },
    downloading: {
      icon: <Loader2 className="size-3 animate-spin" />,
      label: progress === null ? "Downloading" : `${progress}%`,
      tooltip: "Downloading the update...",
      onClick: () => {},
    },
    ready: {
      icon: <RotateCw className="size-3" />,
      label: "Restart",
      tooltip: `Polyglot ${version} is installed — restart to use it`,
      onClick: restart,
    },
  }[status as "available" | "downloading" | "ready"];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={status === "downloading"}
          className={cn(
            "bg-primary text-primary-foreground relative flex h-6 items-center gap-1.5 overflow-hidden rounded-full pr-2.5 pl-2 text-[11px] font-medium shadow-sm transition-all",
            status !== "downloading" && "hover:opacity-90"
          )}
        >
          {icon}
          {label}
          {status === "downloading" && progress !== null && (
            <span
              className="bg-primary-foreground/60 absolute inset-x-0 bottom-0 h-0.5 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Version + update controls, shown inside the Settings dialog. */
export function UpdateSection() {
  const status = useUpdateStore((s) => s.status);
  const version = useUpdateStore((s) => s.version);
  const currentVersion = useUpdateStore((s) => s.currentVersion);
  const error = useUpdateStore((s) => s.error);
  const progress = useUpdateStore((s) => s.progress);
  const { check, install, restart } = useUpdater();

  const busy = status === "checking" || status === "downloading";

  const message = {
    idle: "Checked automatically every two hours.",
    checking: "Checking...",
    available: `Version ${version} is available.`,
    downloading: progress === null ? "Downloading..." : `Downloading... ${progress}%`,
    ready: `Version ${version} is installed. Restart to use it.`,
    "up-to-date": "You are running the latest version.",
    error: error ?? "Could not reach the update server.",
  }[status];

  return (
    <div className="bg-card flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-medium">
          Polyglot{" "}
          <span className="font-semibold tabular-nums">
            {currentVersion ? `v${currentVersion}` : "—"}
          </span>
        </p>
        <p
          className={cn(
            "truncate text-[11px]",
            status === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {message}
        </p>
      </div>

      {status === "available" ? (
        <button
          onClick={install}
          className="bg-primary text-primary-foreground flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-sm hover:opacity-90"
        >
          <ArrowDownToLine className="size-3" />
          Install
        </button>
      ) : status === "ready" ? (
        <button
          onClick={restart}
          className="bg-primary text-primary-foreground flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-sm hover:opacity-90"
        >
          <RotateCw className="size-3" />
          Restart
        </button>
      ) : (
        <button
          onClick={() => check(true)}
          disabled={busy}
          className="border-border hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
          Check
        </button>
      )}
    </div>
  );
}
