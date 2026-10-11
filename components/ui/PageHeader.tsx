import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, count, action }: PageHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[2.4rem] leading-none text-ink">{title}</h1>
          {count !== undefined && count > 0 && <span className="tape tape-pink">{count}</span>}
        </div>
        {subtitle && <p className="mt-1.5 text-base text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
