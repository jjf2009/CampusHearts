/** Hand-drawn Campus Buddy mark: two overlapping doodle hearts. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="#23201b"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M16 38 C 6 30, 3 22, 6 15 C 9 9, 16 9, 19 15 C 22 9, 29 9, 31 15 C 34 22, 28 30, 16 38 Z"
        fill="#ffc2d4"
      />
      <path
        d="M32 41 C 24 35, 21 29, 23 24 C 25 19, 30 19, 33 23 C 35 19, 41 19, 43 24 C 45 29, 41 35, 32 41 Z"
        fill="#ffe066"
      />
      <path d="M9 7 l2 3 M14 4 l0 4 M40 10 l-2 3" strokeWidth={2} />
    </svg>
  );
}

export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-[1.7rem] leading-none font-bold text-ink">
        Campus <span className="text-rose-deep">Buddy</span>
      </span>
    </span>
  );
}
