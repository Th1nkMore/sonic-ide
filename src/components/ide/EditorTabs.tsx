"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type EditorTabsProps = {
  className?: string;
};

export function EditorTabs({ className }: EditorTabsProps) {
  const { openFiles, activeFileId, setActiveFile, closeFile, getFileById } =
    useIDEStore();

  const handleTabClick = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleTabClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0 border-b border-border bg-background overflow-x-auto",
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {openFiles.map((fileId) => {
          const file = getFileById(fileId);
          if (!file) return null;

          const isActive = fileId === activeFileId;

          return (
            <motion.div
              key={fileId}
              layout
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -10 }}
              transition={{
                duration: 0.2,
                layout: { duration: 0.2, type: "spring", bounce: 0.2 },
              }}
              role="tab"
              onClick={() => handleTabClick(fileId)}
              className={cn(
                "group flex items-center gap-2 border-r border-border px-3 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-800/30 cursor-pointer",
                isActive && "bg-background text-gray-300",
              )}
              aria-label={`Switch to ${file.title}`}
              aria-selected={isActive}
            >
              <span className="truncate max-w-[120px]">{file.title}</span>
              <motion.button
                type="button"
                onClick={(e) => handleTabClose(e, fileId)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-700/50 p-0.5",
                  isActive && "opacity-100",
                )}
                aria-label={`Close ${file.title}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
