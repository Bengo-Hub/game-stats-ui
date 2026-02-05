'use client';

import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
}

export function HeroWavePattern({ className }: IllustrationProps) {
  return (
    <svg
      className={cn('absolute inset-0 w-full h-full', className)}
      viewBox="0 0 1440 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.15" />
          <stop offset="50%" stopColor="rgb(139 92 246)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="rgb(236 72 153)" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="waveGlow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="600" fill="url(#heroWaveGrad)" />
      <path
        d="M0 400 Q360 300 720 400 T1440 400 L1440 600 L0 600 Z"
        fill="url(#waveGlow)"
        opacity="0.3"
      />
      <path
        d="M0 450 Q360 380 720 450 T1440 450 L1440 600 L0 600 Z"
        fill="url(#waveGlow)"
        opacity="0.2"
      />
    </svg>
  );
}

export function FloatingOrbs({ className }: IllustrationProps) {
  return (
    <svg
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      viewBox="0 0 1440 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(236 72 153)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(236 72 153)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="120" r="100" fill="url(#orb1)">
        <animate attributeName="cy" values="120;150;120" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="1250" cy="450" r="120" fill="url(#orb2)">
        <animate attributeName="cy" values="450;420;450" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="700" cy="80" r="80" fill="url(#orb3)">
        <animate attributeName="cx" values="700;750;700" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="400" cy="500" r="60" fill="url(#orb1)" opacity="0.5">
        <animate attributeName="cy" values="500;480;500" dur="5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function TrophyIcon({ className }: IllustrationProps) {
  return (
    <svg
      className={cn('w-full h-full', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trophyGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="22" y="50" width="20" height="6" rx="1" fill="url(#trophyGoldGrad)" />
      <rect x="24" y="46" width="16" height="5" rx="1" fill="url(#trophyGoldGrad)" />
      <rect x="28" y="34" width="8" height="14" rx="1" fill="url(#trophyGoldGrad)" />
      <path
        d="M18 12 C18 8 24 5 32 5 C40 5 46 8 46 12 L46 24 C46 32 40 38 32 38 C24 38 18 32 18 24 Z"
        fill="url(#trophyGoldGrad)"
      />
      <path
        d="M18 12 C14 12 10 16 10 22 C10 27 14 31 18 31 L18 26 C16 26 14 24 14 22 C14 19 16 17 18 17 Z"
        fill="url(#trophyGoldGrad)"
      />
      <path
        d="M46 12 C50 12 54 16 54 22 C54 27 50 31 46 31 L46 26 C48 26 50 24 50 22 C50 19 48 17 46 17 Z"
        fill="url(#trophyGoldGrad)"
      />
      <path
        d="M32 14 L34 20 L40 20 L35 24 L37 30 L32 26 L27 30 L29 24 L24 20 L30 20 Z"
        fill="#fef3c7"
        opacity="0.9"
      />
    </svg>
  );
}

export function LivePulse({ className }: IllustrationProps) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="currentColor">
        <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
        <animate attributeName="r" values="6;9;6" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3">
        <animate attributeName="r" values="9;12;9" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function StatsGraph({ className }: IllustrationProps) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" />
          <stop offset="100%" stopColor="rgb(139 92 246)" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(16 185 129)" />
          <stop offset="100%" stopColor="rgb(5 150 105)" />
        </linearGradient>
        <linearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(251 146 60)" />
          <stop offset="100%" stopColor="rgb(234 88 12)" />
        </linearGradient>
      </defs>
      <rect x="8" y="28" width="10" height="28" rx="2" fill="url(#barGrad1)" />
      <rect x="22" y="18" width="10" height="38" rx="2" fill="url(#barGrad2)" />
      <rect x="36" y="24" width="10" height="32" rx="2" fill="url(#barGrad3)" />
      <rect x="50" y="12" width="10" height="44" rx="2" fill="url(#barGrad1)" />
      <line x1="4" y1="58" x2="60" y2="58" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
  );
}

export function GlobalMap({ className }: IllustrationProps) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(59 130 246)" />
          <stop offset="100%" stopColor="rgb(37 99 235)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#globeGrad)" opacity="0.2" />
      <circle cx="32" cy="32" r="26" stroke="url(#globeGrad)" strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="32" rx="10" ry="26" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" fill="none" />
      <ellipse cx="32" cy="32" rx="26" ry="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" fill="none" />
      <line x1="6" y1="32" x2="58" y2="32" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="32" y1="6" x2="32" y2="58" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      {/* Location dots */}
      <circle cx="20" cy="24" r="3" fill="rgb(236 72 153)">
        <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="45" cy="28" r="2.5" fill="rgb(16 185 129)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="42" r="2" fill="rgb(251 146 60)">
        <animate attributeName="r" values="2;3;2" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function EmptyStateCalendar({ className }: IllustrationProps) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" />
          <stop offset="100%" stopColor="rgb(139 92 246)" />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="80" height="70" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
      <rect x="20" y="30" width="80" height="20" rx="8" fill="url(#calGrad)" opacity="0.2" />
      <rect x="20" y="42" width="80" height="8" fill="url(#calGrad)" opacity="0.2" />
      <rect x="38" y="22" width="6" height="14" rx="2" fill="currentColor" fillOpacity="0.3" />
      <rect x="76" y="22" width="6" height="14" rx="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="40" cy="65" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="60" cy="65" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="80" cy="65" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="40" cy="85" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="60" cy="85" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="80" cy="85" r="4" fill="currentColor" fillOpacity="0.1" />
      <g transform="translate(80, 15)">
        <circle cx="15" cy="15" r="14" fill="url(#calGrad)" />
        <text x="15" y="21" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">?</text>
      </g>
    </svg>
  );
}

export function DiscLogo({ className }: IllustrationProps) {
  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="discGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(251 146 60)" />
          <stop offset="100%" stopColor="rgb(234 88 12)" />
        </linearGradient>
        <linearGradient id="discGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(99 102 241)" />
          <stop offset="100%" stopColor="rgb(139 92 246)" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="34" rx="26" ry="8" fill="currentColor" fillOpacity="0.1" />
      <ellipse cx="32" cy="30" rx="24" ry="24" fill="url(#discGrad)" />
      <ellipse cx="32" cy="30" rx="16" ry="16" fill="url(#discGrad2)" opacity="0.3" />
      <ellipse cx="32" cy="30" rx="6" ry="6" fill="white" opacity="0.9" />
      <path d="M26 20 Q32 16 38 20" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}
