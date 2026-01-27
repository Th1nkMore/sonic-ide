"use client";

import {
  ArrowRight,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import type { PlayOrder } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type TerminalPanelProps = {
  className?: string;
  onClose?: () => void;
};

const mockLogs: string[] = [];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function ProgressBar({
  current,
  total,
  onSeek,
}: {
  current: number;
  total: number;
  onSeek: (time: number) => void;
}) {
  const progressRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const seekTime = percentage * total;
      onSeek(seekTime);
    },
    [total, onSeek],
  );

  const percentage = total > 0 ? (current / total) * 100 : 0;
  const filledBars = Math.floor(percentage / 10);
  const hasArrow = percentage > 0 && percentage < 100;

  return (
    <button
      type="button"
      ref={progressRef}
      onClick={handleClick}
      className="flex h-5 w-full cursor-pointer items-center gap-0.5 border border-border bg-gray-900/50 px-1 hover:bg-gray-900/70"
      aria-label={`Audio progress: ${Math.round(percentage)}%`}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const barKey = `progress-bar-${i}-${filledBars}`;
        if (i < filledBars) {
          return (
            <div
              key={barKey}
              className="h-2 flex-1 bg-gray-400"
              aria-hidden="true"
            />
          );
        }
        if (i === filledBars && hasArrow) {
          return (
            <div
              key={barKey}
              className="h-2 flex-1 bg-gray-600 relative"
              aria-hidden="true"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-gray-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent" />
            </div>
          );
        }
        return (
          <div
            key={barKey}
            className="h-2 flex-1 bg-gray-700"
            aria-hidden="true"
          />
        );
      })}
    </button>
  );
}

const playOrderIcons: Record<PlayOrder, typeof Shuffle> = {
  sequential: ArrowRight,
  shuffle: Shuffle,
  repeat: Repeat,
  "repeat-one": Repeat1,
};

function VolumeSlider({
  value,
  onChange,
  playOrder,
  onCyclePlayOrder,
  t,
}: {
  value: number;
  onChange: (v: number) => void;
  playOrder: PlayOrder;
  onCyclePlayOrder: () => void;
  t: (key: string) => string;
}) {
  const filledBars = Math.floor(value * 10);
  const PlayOrderIcon = playOrderIcons[playOrder] || ArrowRight;
  const fullText = t(`playOrder.${playOrder}`);
  const [displayedText, setDisplayedText] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const volumeText = `${Math.round(value * 100)}%`;
  const [displayedVolumeText, setDisplayedVolumeText] = useState("");
  const volumeTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restart typing animation when playOrder (fullText) changes while hovering
  useEffect(() => {
    if (!isHovering) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start new typing animation
    setDisplayedText("");
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 50);
      }
    };

    typingTimeoutRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [fullText, isHovering]);

  const handlePlayOrderMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handlePlayOrderMouseLeave = useCallback(() => {
    setIsHovering(false);
    setDisplayedText("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    setDisplayedVolumeText("");
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < volumeText.length) {
        setDisplayedVolumeText(volumeText.slice(0, currentIndex + 1));
        currentIndex++;
        volumeTypingTimeoutRef.current = setTimeout(typeNextChar, 50);
      }
    };

    volumeTypingTimeoutRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (volumeTypingTimeoutRef.current) {
        clearTimeout(volumeTypingTimeoutRef.current);
      }
    };
  }, [volumeText]);

  const handleBarsClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const barIndex = Math.round(percentage * 9);
      const newVolume = barIndex / 9;
      onChange(newVolume);
    },
    [onChange],
  );

  const handleVolumeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const newVolume = Math.max(0, value - 0.05);
        onChange(newVolume);
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const newVolume = Math.min(1, value + 0.05);
        onChange(newVolume);
      }
    },
    [value, onChange],
  );

  const handleDecrease = useCallback(() => {
    const newVolume = Math.max(0, value - 0.05);
    onChange(newVolume);
  }, [value, onChange]);

  const handleIncrease = useCallback(() => {
    const newVolume = Math.min(1, value + 0.05);
    onChange(newVolume);
  }, [value, onChange]);

  return (
    <div className="flex items-center gap-2">
      <Volume2 className="h-3 w-3 text-gray-500" aria-hidden="true" />
      <span className="hidden sm:inline text-[10px] text-gray-500">VOL</span>
      <button
        type="button"
        onClick={handleDecrease}
        className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
        aria-label="Decrease volume by 5%"
        disabled={value <= 0}
      >
        <Minus className="h-3 w-3" strokeWidth={2} />
      </button>
      <button
        type="button"
        className="flex gap-0.5 cursor-pointer bg-transparent border-none p-0"
        onClick={handleBarsClick}
        onKeyDown={handleVolumeKeyDown}
        aria-label={`Volume: ${Math.round(value * 100)}%`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={`volume-bar-${i}-${filledBars}`}
            className={cn(
              "w-1 h-3 transition-colors",
              i < filledBars ? "bg-gray-400" : "bg-gray-700",
            )}
            aria-hidden="true"
          />
        ))}
      </button>
      <div className="relative group">
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 whitespace-nowrap pointer-events-none">
          {displayedVolumeText}
          {displayedVolumeText.length < volumeText.length && (
            <span className="animate-pulse">|</span>
          )}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
          aria-label="Increase volume by 5%"
          disabled={value >= 1}
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
      <div className="ml-auto relative">
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 whitespace-nowrap pointer-events-none">
          {displayedText}
          {displayedText.length > 0 &&
            displayedText.length < fullText.length && (
              <span className="animate-pulse">|</span>
            )}
        </span>
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
          onClick={onCyclePlayOrder}
          onMouseEnter={handlePlayOrderMouseEnter}
          onMouseLeave={handlePlayOrderMouseLeave}
          aria-label={fullText}
        >
          <PlayOrderIcon className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function TerminalPanel({ className, onClose }: TerminalPanelProps) {
  const {
    isPlaying,
    volume,
    duration,
    currentTime,
    currentTrackId,
    playOrder,
    play,
    pause,
    setVolume,
    seek,
    setTrack,
    playNext,
    playPrevious,
    addToQueue,
    cyclePlayOrder,
  } = usePlayerStore();

  const { files, activeFileId } = useIDEStore();
  const t = useTranslations("terminal");

  const tabs = [t("output"), t("terminal"), t("debugConsole")] as const;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (!currentTrackId) {
      // If no track is selected, use active file from IDE or first file
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
  };

  const handlePrevious = () => {
    if (!currentTrackId) return;
    playPrevious();
    setTimeout(() => play(), 100);
  };

  const handleNext = () => {
    if (!currentTrackId) return;
    playNext();
    setTimeout(() => play(), 100);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-muted font-mono text-[12px] relative",
        className,
      )}
    >
      {/* Close Button - Top right corner (Desktop only) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="hidden md:flex absolute top-2 right-2 z-10 p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
          aria-label="Close terminal"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}

      {/* Tabs - Hidden on mobile */}
      <div className="hidden md:flex border-b border-border bg-muted">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-r border-border px-4 py-2 text-[11px] uppercase text-gray-500 hover:bg-gray-800/50 transition-colors",
              activeTab === tab && "bg-gray-800/50 text-gray-300",
            )}
            aria-label={`Switch to ${tab} tab`}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Logs - Hidden on mobile */}
        <ScrollArea className="hidden md:flex flex-1">
          <div className="p-4 space-y-1 text-gray-400">
            {mockLogs.map((log, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Terminal logs are sequential and order-based, index is appropriate here
              <div key={`${log}-${index}`} className="leading-6">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Player Controls - Always visible, full width on mobile */}
        <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-border flex flex-col">
          {/* Progress Bar */}
          <div className="p-3 space-y-2 border-b border-border">
            <ProgressBar current={currentTime} total={duration} onSeek={seek} />
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="p-3">
            <VolumeSlider
              value={volume}
              onChange={setVolume}
              playOrder={playOrder}
              onCyclePlayOrder={cyclePlayOrder}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
