export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="tbx-mono text-xs uppercase tracking-[.16em] text-[var(--tbx-support)]">{eyebrow}</span>
        <h1 className="mt-2 text-3xl font-bold text-[var(--tbx-text)] sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-[var(--tbx-text-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
