"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type MiniPlayerBarProps = {
  className?: string;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function MiniPlayerBar({ className }: MiniPlayerBarProps) {
  const {
    isPlaying,
    duration,
    currentTime,
    currentTrackId,
    play,
    pause,
    seek,
    setTrack,
    playNext,
    playPrevious,
    addToQueue,
  } = usePlayerStore();

  const { files, activeFileId, getFileById } = useIDEStore();

  // Get current track title
  const currentTrack = useMemo(
    () => (currentTrackId ? getFileById(currentTrackId) : null),
    [currentTrackId, getFileById],
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (!currentTrackId) {
      const trackToPlay = activeFileId
        ? files.find((f) => f.id === activeFileId)
        : files[0];

      if (trackToPlay) {
        addToQueue(trackToPlay);
        setTrack(trackToPlay.id);
        setTimeout(() => play(trackToPlay), 100);
      }
    } else {
      play();
    }
  }, [
    isPlaying,
    currentTrackId,
    activeFileId,
    files,
    pause,
    play,
    addToQueue,
    setTrack,
  ]);

  const handlePrevious = useCallback(() => {
    if (!currentTrackId) return;
    playPrevious();
    setTimeout(() => play(), 100);
  }, [currentTrackId, playPrevious, play]);

  const handleNext = useCallback(() => {
    if (!currentTrackId) return;
    playNext();
    setTimeout(() => play(), 100);
  }, [currentTrackId, playNext, play]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      seek(percent * duration);
    },
    [seek, duration],
  );

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 bg-muted border-t border-border",
        className,
      )}
    >
      {/* Playback Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handlePrevious}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
          aria-label="Previous"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
          aria-label="Next"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Track Info & Progress */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Track Title */}
        <span className="text-[10px] text-gray-400 truncate">
          {currentTrack?.title || "No track selected"}
        </span>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 w-8 shrink-0">
            {formatDuration(currentTime)}
          </span>
          <button
            type="button"
            onClick={handleSeek}
            className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer group"
            aria-label={`Progress: ${Math.round(percentage)}%`}
          >
            <div
              className="h-full bg-gray-400 group-hover:bg-gray-300 transition-colors"
              style={{ width: `${percentage}%` }}
            />
          </button>
          <span className="text-[9px] text-gray-500 w-8 shrink-0 text-right">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
