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
    <div className="surface rounded-3xl px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blush text-rose-deep">
        {icon}
      </div>
      <h2 className="font-serif text-xl text-charcoal">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="btn-primary mt-6 inline-flex rounded-full px-6 py-2.5 text-sm font-medium text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
