import { invoke } from "@tauri-apps/api/core";
import { Minus, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UpdateBadge } from "./UpdateBadge";
import { useAppStore } from "@/store/appStore";
import logo from "@/assets/logo.svg";

/**
 * Frameless title bar. The tab switcher lives here rather than in a second row:
 * the window is only 560px tall, so every reclaimed row goes to the text areas.
 */
export function TitleBar() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <header
      className="relative flex h-11 shrink-0 items-center justify-between border-b px-3"
      data-tauri-drag-region
    >
      <div className="pointer-events-none flex items-center gap-2" data-tauri-drag-region>
        <img src={logo} alt="Polyglot" className="h-4.5 opacity-90" />
      </div>

      {/* Centred independently of the side columns so it never drifts. */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <TabsList className="bg-muted/60 h-7 gap-0.5 rounded-full p-0.5">
          <TabsTrigger
            value="translate"
            className="pg-tab h-6 rounded-full px-3.5 text-xs font-medium"
          >
            Translate
          </TabsTrigger>
          <TabsTrigger
            value="correct"
            className="pg-tab h-6 rounded-full px-3.5 text-xs font-medium"
          >
            Correct
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex items-center gap-1">
        <UpdateBadge />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-3.5" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7"
                onClick={() => invoke("hide_window_cmd")}
              >
                <Minus className="size-3.5" />
                <span className="sr-only">Hide</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Hide to tray</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive size-7"
                onClick={() => invoke("hide_window_cmd")}
              >
                <X className="size-3.5" />
                <span className="sr-only">Close</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close to tray</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
