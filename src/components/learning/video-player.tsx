"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Captions, CaptionsOff, ChevronDown, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { anchorId, fmtClock, type VideoBlock } from "./data";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function CtrlButton({ label, onClick, children, pressed, className }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[8px] text-paper transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-jade",
        pressed && "bg-white/12",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Accessible custom player for the bundled narrated sample videos.
 * Captions come from the session's WebVTT <track> (rendered in our own
 * overlay so they stay legible in full screen); the transcript seeks on click
 * and follows playback.
 */
export function VideoPlayer({ block }: { block: VideoBlock }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(block.durationSec || 0);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [cue, setCue] = useState("");
  const [rate, setRate] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [follow, setFollow] = useState(true);

  // Captions: keep the native rendering hidden and mirror the active cue into our overlay.
  useEffect(() => {
    const el = trackRef.current;
    if (!el?.track) return;
    const tt = el.track;
    tt.mode = "hidden";
    const onCue = () => {
      const active = tt.activeCues;
      const text = active && active.length ? Array.from(active).map((c) => (c as VTTCue).text).join("\n") : "";
      setCue(text);
    };
    tt.addEventListener("cuechange", onCue);
    return () => tt.removeEventListener("cuechange", onCue);
  }, [block.captions]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < block.transcript.length; i++) if (block.transcript[i].t <= current + 0.05) idx = i;
    return idx;
  }, [block.transcript, current]);

  // Keep the active transcript line in view inside its own scroll area (never scrolls the page).
  useEffect(() => {
    if (!follow || !started || activeIndex < 0) return;
    const list = listRef.current;
    const item = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !item) return;
    const top = item.offsetTop; // the list is `relative`, so this is list-relative
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: "smooth" });
    }
  }, [activeIndex, follow, started]);

  function video() {
    return videoRef.current;
  }

  function togglePlay() {
    const v = video();
    if (!v || error) return;
    if (v.paused || v.ended) {
      void v.play().catch(() => setError(true));
    } else v.pause();
  }

  function seekTo(t: number, play = false) {
    const v = video();
    if (!v) return;
    const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : duration;
    const next = Math.max(0, Math.min(d || t, t));
    v.currentTime = next;
    setCurrent(next);
    setEnded(false);
    if (play && v.paused) void v.play().catch(() => setError(true));
  }

  function toggleMute() {
    const v = video();
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function changeRate(r: number) {
    const v = video();
    if (v) v.playbackRate = r;
    setRate(r);
  }

  function toggleFullscreen() {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
    const isButton = tag === "BUTTON";
    switch (e.key) {
      case " ":
      case "k":
      case "K":
        if (isButton && e.key === " ") return; // let the focused button act
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
      case "j":
      case "J":
        e.preventDefault();
        seekTo(current - (e.key === "ArrowLeft" ? 5 : 10));
        break;
      case "ArrowRight":
      case "l":
      case "L":
        e.preventDefault();
        seekTo(current + (e.key === "ArrowRight" ? 5 : 10));
        break;
      case "Home":
        e.preventDefault();
        seekTo(0);
        break;
      case "End":
        e.preventDefault();
        seekTo(duration);
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "c":
      case "C":
        setCaptionsOn((v) => !v);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      default:
        break;
    }
  }

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;
  const titleId = `${anchorId(block.id)}-title`;

  return (
    <figure className="my-0" aria-labelledby={titleId}>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-void px-2.5 text-[12px] font-medium text-paper">
          <Sparkles className="size-3.5 text-jade" aria-hidden />
          Narrated sample video
        </span>
        <span id={titleId} className="text-[15px] font-semibold text-void">
          {block.title}
        </span>
        <span className="text-[13.5px] text-muted tabular">{fmtClock(block.durationSec || duration)}</span>
      </div>

      {/* Player */}
      <div
        ref={frameRef}
        role="group"
        aria-label={`Video player: ${block.title}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          "group/player overflow-hidden rounded-[16px] bg-void text-paper outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-void",
          fullscreen && "flex flex-col rounded-none",
        )}
      >
        <div className={cn("relative aspect-video w-full bg-void", fullscreen && "min-h-0 flex-1 aspect-auto")}>
          <video
            ref={videoRef}
            className="absolute inset-0 size-full cursor-pointer object-contain"
            src={block.src}
            poster={block.poster}
            preload="metadata"
            playsInline
            onClick={togglePlay}
            onPlay={() => {
              setPlaying(true);
              setStarted(true);
              setEnded(false);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) setDuration(e.currentTarget.duration);
            }}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onError={() => setError(true)}
            aria-describedby={block.transcript.length ? `${anchorId(block.id)}-transcript` : undefined}
          >
            {block.captions && <track ref={trackRef} kind="captions" src={block.captions} srcLang="en" label="English" default />}
          </video>

          {/* Caption overlay */}
          {captionsOn && cue && !error && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6" aria-hidden>
              <p className="max-w-[88%] whitespace-pre-line rounded-[6px] bg-black/78 px-3 py-1.5 text-center text-[14px] leading-snug text-paper sm:text-[17px]">{cue}</p>
            </div>
          )}

          {/* Big play button before start / after end */}
          {!playing && !error && (!started || ended) && (
            <button
              type="button"
              onClick={() => (ended ? seekTo(0, true) : togglePlay())}
              className="absolute inset-0 grid place-items-center bg-black/25 transition-colors hover:bg-black/35"
              aria-label={ended ? "Replay video" : `Play video: ${block.title}`}
            >
              <span className="grid size-16 place-items-center rounded-full bg-jade text-void shadow-float transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/player:scale-105 sm:size-20">
                {ended ? <RotateCcw className="size-7" aria-hidden /> : <Play className="ml-1 size-8 fill-current" aria-hidden />}
              </span>
            </button>
          )}

          {buffering && playing && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
              <Loader2 className="size-8 animate-spin text-paper/80" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 grid place-items-center bg-void/90 p-6 text-center" role="alert">
              <div className="max-w-sm">
                <AlertTriangle className="mx-auto size-6 text-lemon" aria-hidden />
                <p className="mt-2 text-[15px] font-medium">This video couldn&apos;t load in your browser.</p>
                <p className="mt-1 text-[13.5px] text-[#bdbdbd]">Everything that&apos;s said is in the transcript below.</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-2 pb-1.5 pt-2 sm:px-3">
          <div className="flex items-center gap-2 px-1">
            <label htmlFor={`${anchorId(block.id)}-seek`} className="sr-only">
              Seek
            </label>
            <input
              id={`${anchorId(block.id)}-seek`}
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={Math.min(current, duration || current)}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-valuetext={`${fmtClock(current)} of ${fmtClock(duration)}`}
              disabled={error}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jade [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper"
              style={{ background: `linear-gradient(to right, #00c27a 0%, #00c27a ${pct}%, #4b4b4b ${pct}%, #4b4b4b 100%)` }}
            />
          </div>
          <div className="mt-1 flex items-center gap-0.5">
            <CtrlButton label={playing ? "Pause" : ended ? "Replay" : "Play"} onClick={() => (ended ? seekTo(0, true) : togglePlay())}>
              {playing ? <Pause className="size-5 fill-current" aria-hidden /> : ended ? <RotateCcw className="size-5" aria-hidden /> : <Play className="size-5 fill-current" aria-hidden />}
            </CtrlButton>
            <CtrlButton label="Mute" onClick={toggleMute} pressed={muted}>
              {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
            </CtrlButton>
            <span className="ml-1 text-[13px] tabular text-[#cfcfcf]" aria-hidden>
              {fmtClock(current)} <span className="text-[#8c8c8c]">/ {fmtClock(duration)}</span>
            </span>
            <span className="flex-1" />
            {block.captions && (
              <CtrlButton label="Captions" onClick={() => setCaptionsOn((v) => !v)} pressed={captionsOn}>
                {captionsOn ? <Captions className="size-5" aria-hidden /> : <CaptionsOff className="size-5" aria-hidden />}
              </CtrlButton>
            )}
            <label className="relative flex h-10 items-center">
              <span className="sr-only">Playback speed</span>
              <select
                value={rate}
                onChange={(e) => changeRate(Number(e.target.value))}
                className="h-8 cursor-pointer appearance-none rounded-[7px] bg-transparent pl-2 pr-6 text-[13px] font-medium text-paper tabular hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-jade"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s} className="text-void">
                    {s}×
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3.5 text-[#cfcfcf]" aria-hidden />
            </label>
            <CtrlButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="size-5" aria-hidden /> : <Maximize className="size-5" aria-hidden />}
            </CtrlButton>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12.5px] text-muted">
        <span>Synthetic narration over slides, made for this demo.</span>
        <span className="hidden sm:inline">
          <span className="font-medium text-ink">Space</span> play · <span className="font-medium text-ink">← →</span> skip · <span className="font-medium text-ink">C</span> captions ·{" "}
          <span className="font-medium text-ink">M</span> mute · <span className="font-medium text-ink">F</span> full screen
        </span>
      </figcaption>

      {/* Transcript */}
      {block.transcript.length > 0 && (
        <div className="mt-4 rounded-[16px] border-[1.5px] border-line bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript}
              aria-controls={`${anchorId(block.id)}-transcript`}
              className="inline-flex h-9 items-center gap-2 rounded-[8px] text-[14.5px] font-semibold text-void"
            >
              <ChevronDown className={cn("size-4 transition-transform duration-200", !showTranscript && "-rotate-90")} aria-hidden />
              Transcript
            </button>
            {showTranscript && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="size-4 accent-[#00c27a]" />
                Follow along
              </label>
            )}
          </div>
          <ol
            ref={listRef}
            id={`${anchorId(block.id)}-transcript`}
            hidden={!showTranscript}
            className="relative m-0 max-h-[280px] list-none overflow-y-auto border-t border-line p-2"
            aria-label={`Transcript of ${block.title}`}
          >
            {block.transcript.map((line, i) => {
              const active = i === activeIndex && started;
              return (
                <li key={i} className="m-0">
                  <button
                    type="button"
                    onClick={() => seekTo(line.t, true)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors",
                      active ? "bg-leaf" : "hover:bg-fog",
                    )}
                  >
                    <span className={cn("mt-[1px] w-10 shrink-0 font-mono text-[12px] tabular", active ? "font-semibold text-leaf-ink" : "text-muted")}>
                      <span className="sr-only">Jump to </span>
                      {fmtClock(line.t)}
                    </span>
                    <span className={cn("text-[14.5px] leading-relaxed", active ? "text-void" : "text-ink")}>{line.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </figure>
  );
}
