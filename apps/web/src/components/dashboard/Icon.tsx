import type { ReactNode } from "react";

export type IconName =
  | "zap"
  | "target"
  | "mail"
  | "linkedin"
  | "trending"
  | "check"
  | "star"
  | "copy"
  | "send"
  | "clock"
  | "refresh"
  | "bar"
  | "user"
  | "arrow"
  | "sparkle"
  | "chevronDown";

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  const stroke = "currentColor";
  const icons: Record<IconName, ReactNode> = {
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polygon
          points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
          stroke={stroke}
          strokeWidth="2"
        />
      </svg>
    ),
    target: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="2" />
        <circle cx="12" cy="12" r="6" stroke={stroke} strokeWidth="2" />
        <circle cx="12" cy="12" r="2" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="2" y="4" width="20" height="16" rx="2" stroke={stroke} strokeWidth="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    trending: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke={stroke} strokeWidth="2" />
        <polyline points="16 7 22 7 22 13" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polyline points="20 6 9 17 4 12" stroke={stroke} strokeWidth="2.5" />
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    copy: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="9" y="9" width="13" height="13" rx="2" stroke={stroke} strokeWidth="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <line x1="22" y1="2" x2="11" y2="13" stroke={stroke} strokeWidth="2" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    clock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="2" />
        <polyline points="12 6 12 12 16 14" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polyline points="23 4 23 10 17 10" stroke={stroke} strokeWidth="2" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    bar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <line x1="18" y1="20" x2="18" y2="10" stroke={stroke} strokeWidth="2" />
        <line x1="12" y1="20" x2="12" y2="4" stroke={stroke} strokeWidth="2" />
        <line x1="6" y1="20" x2="6" y2="14" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={stroke} strokeWidth="2" />
        <circle cx="12" cy="7" r="4" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    arrow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <line x1="5" y1="12" x2="19" y2="12" stroke={stroke} strokeWidth="2" />
        <polyline points="12 5 19 12 12 19" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    sparkle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0L14.59 9.41 24 12 14.59 14.59 12 24 9.41 14.59 0 12 9.41 9.41Z" opacity="0.3" />
        <path d="M12 3L13.5 9.5 20 11 13.5 12.5 12 19 10.5 12.5 4 11 10.5 9.5Z" />
      </svg>
    ),
    chevronDown: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polyline points="6 9 12 15 18 9" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
  };

  return <span className="inline-flex shrink-0">{icons[name]}</span>;
}
