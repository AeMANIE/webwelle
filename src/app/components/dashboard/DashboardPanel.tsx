import { cn } from '@/lib/utils';

interface DashboardPanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** CoreUI-style content card for dashboard tables and forms */
export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  noPadding,
}: DashboardPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/10',
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5 sm:p-6')}>{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconClassName?: string;
}

export function DashboardStatCard({ label, value, icon, iconClassName }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
