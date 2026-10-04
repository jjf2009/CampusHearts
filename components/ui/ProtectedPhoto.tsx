"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LockIcon } from "@/components/ui/icons";

/**
 * Profile photos are never put in an <img src>. They're fetched from the
 * auth-checked /api/photos route, drawn onto a canvas only while the viewer
 * holds their finger/mouse down, and stamped with the viewer's name so any
 * screenshot that slips through can be traced back to them.
 *
 * A website can't fully block OS screenshots or a second phone's camera;
 * this makes casual saving hard and leaks attributable.
 */

const HOLD_DELAY_MS = 150;
const MOVE_TOLERANCE_PX = 10;
const MAX_REVEAL_MS = 8000;

const ViewerContext = createContext<string>("CampusHearts");

export function ViewerWatermarkProvider({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return <ViewerContext.Provider value={label}>{children}</ViewerContext.Provider>;
}

const bitmapCache = new Map<string, Promise<ImageBitmap>>();

function photoUrl(path: string) {
  return `/api/photos/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function loadBitmap(path: string) {
  let pending = bitmapCache.get(path);
  if (!pending) {
    pending = fetch(photoUrl(path), { cache: "no-store", credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Photo unavailable (${res.status})`);
        return res.blob();
      })
      .then((blob) => createImageBitmap(blob));
    pending.catch(() => bitmapCache.delete(path));
    bitmapCache.set(path, pending);
  }
  return pending;
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, label: string, dpr: number) {
  const stamp = `${label} · ${new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = `600 ${13 * dpr}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = dpr;
  const stepY = 64 * dpr;
  const stepX = ctx.measureText(stamp).width + 48 * dpr;
  const span = Math.hypot(w, h);
  for (let y = -span / 2, row = 0; y < span / 2; y += stepY, row++) {
    for (let x = -span / 2 + (row % 2) * (stepX / 2); x < span / 2; x += stepX) {
      ctx.strokeText(stamp, x, y);
      ctx.fillText(stamp, x, y);
    }
  }
  ctx.restore();
}

function isScreenshotShortcut(e: KeyboardEvent) {
  if (e.key === "PrintScreen") return true;
  // macOS: Cmd+Shift+3/4/5, Windows: Win+Shift+S
  if (e.metaKey && e.shiftKey && ["3", "4", "5", "s", "S"].includes(e.key)) return true;
  return false;
}

export default function ProtectedPhoto({
  path,
  alt,
  className = "",
  hint = true,
}: {
  path: string | undefined;
  alt: string;
  className?: string;
  /** Show the "Hold to view" label on the placeholder. */
  hint?: boolean;
}) {
  const viewer = useContext(ViewerContext);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const holding = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const hide = useCallback(() => {
    holding.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setRevealed(false);
    setLoading(false);
  }, []);

  const reveal = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    let img: ImageBitmap;
    try {
      img = await loadBitmap(path);
    } catch {
      setLoading(false);
      setWarning("Photo unavailable");
      return;
    }
    // Let go while it was loading? Don't show it.
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!holding.current || !canvas || !wrapper) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(wrapper.clientWidth * dpr);
    const h = Math.round(wrapper.clientHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCover(ctx, img, w, h);
    drawWatermark(ctx, w, h, viewer, dpr);
    setLoading(false);
    setRevealed(true);
    maxTimer.current = setTimeout(hide, MAX_REVEAL_MS);
  }, [path, viewer, hide]);

  // Hide the moment the page loses focus or a screenshot shortcut is pressed.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") hide();
    }
    function onKey(e: KeyboardEvent) {
      if (!isScreenshotShortcut(e)) return;
      hide();
      setWarning("Screenshots of photos aren't allowed");
      navigator.clipboard?.writeText("").catch(() => {});
    }
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      hide();
    };
  }, [hide]);

  useEffect(() => {
    if (!warning) return;
    const t = setTimeout(() => setWarning(null), 2200);
    return () => clearTimeout(t);
  }, [warning]);

  // A different photo (e.g. flipping through a profile) must start hidden.
  useEffect(() => hide, [path, hide]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 || !path) return;
    e.stopPropagation();
    holding.current = true;
    start.current = { x: e.clientX, y: e.clientY };
    holdTimer.current = setTimeout(reveal, HOLD_DELAY_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || revealed) return;
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE_PX) {
      hide();
    }
  }

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={revealed ? alt : `${alt}. Press and hold to view.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`protected-photo ${/\babsolute\b/.test(className) ? "" : "relative"} overflow-hidden bg-gradient-to-br from-rose-soft/50 via-peach/40 to-lavender/50 ${
        path ? "cursor-pointer" : ""
      } ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-150 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      />

      {!revealed && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-charcoal/70 backdrop-blur-xl">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/60 ${
              loading ? "animate-pulse" : ""
            }`}
          >
            <LockIcon width={22} height={22} />
          </span>
          {hint && path && (
            <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium">
              {loading ? "Unlocking…" : "Hold to view"}
            </span>
          )}
        </div>
      )}

      {warning && (
        <span
          role="status"
          className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-charcoal/85 px-3 py-2 text-center text-xs font-medium text-white"
        >
          {warning}
        </span>
      )}
    </div>
  );
}
