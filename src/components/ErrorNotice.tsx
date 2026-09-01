import { AlertTriangle, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorNoticeProps {
  message: string;
  variant?: "error" | "warning";
  className?: string;
}

/**
 * Failures used to go to console.error only: the spinner stopped and nothing
 * showed up, which read as "the app randomly does nothing".
 */
export function ErrorNotice({ message, variant = "error", className }: ErrorNoticeProps) {
  const Icon = variant === "error" ? CircleAlert : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "flex shrink-0 items-start gap-2 rounded-lg border px-3 py-2 text-xs",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400",
        className
      )}
    >
      <Icon className="mt-px size-3.5 shrink-0" />
      <span data-selectable className="leading-relaxed">
        {message}
      </span>
    </div>
  );
}
