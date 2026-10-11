"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/ui/icons";

/**
 * Bottom sheet on phones, centred card on bigger screens.
 * Closes on Escape or backdrop tap, locks page scroll, and focuses itself.
 * Rendered into <body>, above the navigation bars.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Portal to <body> so the sheet is never trapped under another fixed layer (e.g. the tab bar).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-pop-in pb-safe relative max-h-[88dvh] w-full overflow-y-auto border-2 border-ink bg-paper px-5 pt-4 shadow-[0_-4px_0_#23201b] outline-none sm:max-w-lg sm:rounded-[var(--wobble)] sm:pb-5 sm:shadow-[5px_6px_0_#23201b] rounded-t-[28px]"
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-ink/30 sm:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-white"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
