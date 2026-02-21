'use client';

import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Menu,
  Radio,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

const navigation = [
  { name: 'Discover', href: '/discover', icon: Calendar, description: 'Find events & tournaments' },
  { name: 'Live', href: '/live', icon: Radio, description: 'Watch live games', badge: 'LIVE' },
  { name: 'Teams', href: '/directory', icon: Users, description: 'Browse team profiles' },
  { name: 'Leaderboards', href: '/leaderboards', icon: BarChart3, description: 'Top performers' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-18 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Logo size="sm" showText variant="full" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className={cn('h-4 w-4 transition-transform group-hover:scale-110', isActive && 'text-indigo-500')} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/login" className="hidden sm:block">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Get Started
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
            mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isActive
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', isActive && 'text-indigo-600 dark:text-indigo-400')}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}

            {/* Mobile Auth */}
            <div className="pt-4 mt-4 border-t space-y-2 px-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
