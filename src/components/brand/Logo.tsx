'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon';
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function Logo({
  className,
  size = 'md',
  showText = true,
  variant = 'full',
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative shrink-0', sizeClasses[size])}>
        <Image
          src="/logo.svg"
          alt="UltimateStats Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && variant === 'full' && (
        <span
          className={cn(
            'font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent',
            textSizeClasses[size]
          )}
        >
          UltimateStats
        </span>
      )}
    </div>
  );
}

// Inline SVG version for places where we need more control
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-full h-full', className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="logoGradAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#logoGradPrimary)" opacity="0.1" />
      <circle cx="100" cy="100" r="85" fill="none" stroke="url(#logoGradPrimary)" strokeWidth="3" />
      <rect x="55" y="95" width="18" height="45" rx="4" fill="url(#logoGradPrimary)" />
      <rect x="78" y="60" width="18" height="80" rx="4" fill="url(#logoGradAccent)" />
      <rect x="101" y="75" width="18" height="65" rx="4" fill="url(#logoGradPrimary)" />
      <rect x="124" y="85" width="18" height="55" rx="4" fill="url(#logoGradPrimary)" opacity="0.8" />
      <g transform="translate(100, 50)">
        <path d="M0 -15 L10 0 L5 0 L5 15 L-5 15 L-5 0 L-10 0 Z" fill="url(#logoGradAccent)" />
      </g>
    </svg>
  );
}
