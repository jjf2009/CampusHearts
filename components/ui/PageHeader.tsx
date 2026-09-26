interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
}

export default function PageHeader({ title, subtitle, count }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-3xl text-charcoal">{title}</h1>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-rose-soft/20 px-2.5 py-0.5 text-sm font-medium text-rose-ink">
            {count}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
