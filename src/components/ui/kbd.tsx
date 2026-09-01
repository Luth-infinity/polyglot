import * as React from "react"

import { cn } from "@/lib/utils"

/** Small keycap used for shortcut hints. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground border-border inline-flex h-4.5 min-w-4.5 items-center justify-center rounded border px-1 font-mono text-[10px] font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
