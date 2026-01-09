'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  href: string;
  isLoading?: boolean;
}

export default function DashboardCard({
  icon: Icon,
  value,
  label,
  href,
  isLoading = false,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 flex items-center gap-4 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 cursor-pointer no-underline"
    >
      <div className="text-4xl w-[60px] h-[60px] flex items-center justify-center">
        <Icon size={40} />
      </div>
      <div>
        <div className="text-3xl font-bold text-[var(--color-text-primary)]">
          {isLoading ? '...' : value}
        </div>
        <div className="text-sm text-[var(--color-text-secondary)]">
          {label}
        </div>
      </div>
    </Link>
  );
}
