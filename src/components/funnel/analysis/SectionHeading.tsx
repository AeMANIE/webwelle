'use client';

import type { LucideIcon } from 'lucide-react';

type SectionHeadingProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
};

export function SectionHeading({
  icon: Icon,
  children,
  as = 'h3',
  className = '',
}: SectionHeadingProps) {
  const Tag = as;
  const textClass = as === 'h2' ? 'text-xl font-semibold' : 'text-sm font-semibold';

  return (
    <Tag className={`flex items-center gap-2 ${textClass} ${className}`}>
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      {children}
    </Tag>
  );
}
