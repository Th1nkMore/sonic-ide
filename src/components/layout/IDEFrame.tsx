"use client";

import { Menu, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type IDEFrameProps = {
  className?: string;
  leftSidebar: ReactNode;
  centerEditor: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
};

export function IDEFrame({
  className,
  leftSidebar,
  centerEditor,
  rightInspector,
  bottomTerminal,
}: IDEFrameProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTerminalVisible, setMobileTerminalVisible] = useState(true);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);
  const { getActiveFile, fetchSongs, isLoading } = useIDEStore();
  const activeFile = getActiveFile();
  const t = useTranslations("loading");

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    // Only set desktop state on client side to avoid SSR mismatch
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint (768px)
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const handleToggleTerminal = () => {
    if (!terminalPanelRef.current) return;

    // Check actual panel state using isCollapsed()
    if (terminalPanelRef.current.isCollapsed()) {
      terminalPanelRef.current.expand();
    } else {
      terminalPanelRef.current.collapse();
    }
  };

  const handleToggleMobileTerminal = () => {
    setMobileTerminalVisible((prev) => !prev);
  };

  const handleTerminalResize = (
    panelSize: { asPercentage: number; inPixels: number },
    _id: string | number | undefined,
    _prevPanelSize: { asPercentage: number; inPixels: number } | undefined,
  ) => {
    // Terminal is considered visible if size is greater than 0
    setTerminalVisible(panelSize.asPercentage > 0);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 font-mono text-[14px] text-gray-400">
            {t("bootingSystem")}
          </div>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full w-full animate-pulse bg-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalAudioPlayer />
      <div
        className={cn(
          "flex h-screen w-full flex-col overflow-hidden bg-background",
          className,
        )}
      >
        {/* Header - Fixed at top */}
        <header className="flex items-center justify-between gap-2 border-b border-border bg-sidebar px-4 py-2">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[250px] bg-sidebar border-border p-0"
              >
                <SheetTitle className="sr-only">File Explorer</SheetTitle>
                <FileExplorer onFileClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
              {activeFile?.title || "Sonic IDE"}
            </span>
            <button
              type="button"
              onClick={handleToggleMobileTerminal}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors",
                mobileTerminalVisible && "bg-gray-800/50 text-gray-300",
              )}
              aria-label={
                mobileTerminalVisible ? "Hide terminal" : "Show terminal"
              }
              aria-pressed={mobileTerminalVisible}
            >
              <Terminal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Terminal Toggle Button - Desktop only */}
            <button
              type="button"
              onClick={handleToggleTerminal}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors"
              aria-label={terminalVisible ? "Hide terminal" : "Show terminal"}
              aria-pressed={terminalVisible}
            >
              <Terminal className="h-4 w-4" />
            </button>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Mobile Layout - Only render on mobile */}
        {!isDesktop && (
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <main className="flex-1 min-h-0 overflow-hidden bg-background">
              {centerEditor}
            </main>
            {/* Fixed Bottom Panel - Replaces Sheet */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 z-50 bg-muted border-t border-border transition-transform duration-300 ease-in-out",
                mobileTerminalVisible ? "translate-y-0" : "translate-y-full",
              )}
              style={{
                maxHeight: "40vh",
              }}
            >
              <div className="h-full overflow-hidden">
                {bottomTerminal &&
                typeof bottomTerminal === "object" &&
                "props" in bottomTerminal
                  ? React.cloneElement(
                      bottomTerminal as React.ReactElement<{
                        onClose?: () => void;
                      }>,
                      {
                        onClose: handleToggleMobileTerminal,
                      },
                    )
                  : bottomTerminal}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout - Only render on desktop */}
        {isDesktop && (
          <Group orientation="horizontal" className="flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <Panel
              defaultSize="20"
              minSize="15"
              maxSize="40"
              className="border-r border-border bg-sidebar overflow-hidden"
            >
              {leftSidebar}
            </Panel>

            <Separator className="w-2 min-w-2 bg-transparent hover:bg-border/50 transition-colors cursor-col-resize relative flex items-center justify-center group">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Separator>

            {/* Center Area - Contains Editor and Terminal vertically */}
            <Panel
              defaultSize="50"
              minSize="30"
              className="flex flex-col overflow-hidden bg-background border-r border-border"
            >
              <Group orientation="vertical" className="flex-1">
                {/* Editor */}
                <Panel defaultSize="70" minSize="30">
                  <div className="h-full overflow-hidden">{centerEditor}</div>
                </Panel>

                {/* Terminal Resize Handle - Always present to maintain layout structure */}
                <Separator className="h-1 bg-transparent hover:bg-border/50 transition-colors cursor-row-resize relative flex items-center justify-center group">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Separator>

                {/* Terminal - Collapsible */}
                <Panel
                  panelRef={terminalPanelRef}
                  defaultSize="30"
                  minSize="0"
                  collapsible
                  onResize={handleTerminalResize}
                  className="overflow-hidden bg-muted border-t border-border"
                >
                  {bottomTerminal &&
                  typeof bottomTerminal === "object" &&
                  "props" in bottomTerminal
                    ? React.cloneElement(
                        bottomTerminal as React.ReactElement<{
                          onClose?: () => void;
                        }>,
                        {
                          onClose: handleToggleTerminal,
                        },
                      )
                    : bottomTerminal}
                </Panel>
              </Group>
            </Panel>

            <Separator className="w-2 min-w-2 bg-transparent hover:bg-border/50 transition-colors cursor-col-resize relative flex items-center justify-center group">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Separator>

            {/* Right Inspector */}
            <Panel
              defaultSize="30"
              minSize="20"
              maxSize="45"
              className="bg-sidebar overflow-hidden"
            >
              {rightInspector}
            </Panel>
          </Group>
        )}
      </div>
    </>
  );
}
