import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { href: string; label: string };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="sketch px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 rotate-[-4deg] items-center justify-center rounded-full border-2 border-ink bg-marker-yellow text-ink">
        {icon}
      </div>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-base leading-snug text-muted">{description}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-6 inline-flex items-center rounded-full px-6 py-2.5">
          {action.label}
        </Link>
      )}
    </div>
  );
}
