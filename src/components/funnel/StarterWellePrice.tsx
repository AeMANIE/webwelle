import { formatEuro, STARTERWELLE } from '@/lib/funnel/packages';

const sizeStyles = {
  sm: {
    old: 'text-base',
    new: 'text-xl',
  },
  md: {
    old: 'text-xl',
    new: 'text-3xl',
  },
  lg: {
    old: 'text-2xl',
    new: 'text-4xl',
  },
} as const;

type StarterWellePriceProps = {
  size?: keyof typeof sizeStyles;
  className?: string;
  align?: 'left' | 'right';
};

export function StarterWellePrice({
  size = 'md',
  className = '',
  align = 'left',
}: StarterWellePriceProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={[
        'flex flex-wrap items-baseline gap-x-3 gap-y-1',
        align === 'right' ? 'justify-end' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          styles.old,
          'font-semibold text-muted-foreground',
          'line-through decoration-solid decoration-[2.5px] decoration-red-500/80',
        ].join(' ')}
        aria-label={`Ursprünglich ${formatEuro(STARTERWELLE.compareAtPriceCents)}`}
      >
        {formatEuro(STARTERWELLE.compareAtPriceCents)}
      </span>
      <span
        className={[styles.new, 'font-bold text-primary'].join(' ')}
        aria-label={`Jetzt ${formatEuro(STARTERWELLE.priceCents)}`}
      >
        {formatEuro(STARTERWELLE.priceCents)}
      </span>
    </div>
  );
}

/** Kompakte Inline-Darstellung z. B. in Überschriften */
export function StarterWellePriceInline() {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="font-semibold text-muted-foreground line-through decoration-solid decoration-2 decoration-red-500/80">
        {formatEuro(STARTERWELLE.compareAtPriceCents)}
      </span>
      <span className="font-bold text-primary">{formatEuro(STARTERWELLE.priceCents)}</span>
    </span>
  );
}
