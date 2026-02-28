'use client';

import { cn } from '@/lib/utils';

import { Logo } from '@/components/brand/Logo';
import Link from 'next/link';

interface FooterProps {
    className?: string;
    variant?: 'compact' | 'full';
}

const navigation = {
    platform: [
        { name: 'Events', href: '/discover' },
        { name: 'Live Scores', href: '/live' },
        { name: 'Teams', href: '/directory' },
    ],
    features: [
        { name: 'Leaderboards', href: '/leaderboards' },
        { name: 'Analytics', href: '/analytics' },
        { name: 'Spirit Scores', href: '#' },
    ],
    resources: [
        { name: 'Documentation', href: '#' },
        { name: 'API', href: '#' },
        { name: 'Support', href: '#' },
    ],
    account: [
        { name: 'Sign In', href: '/login' },
        { name: 'Register', href: '/login' },
    ],
};

export function Footer({ className, variant = 'compact' }: FooterProps) {
    if (variant === 'full') {
        return (
            <footer className={cn("border-t bg-background/50 pt-16 pb-8", className)}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-8 pb-12">
                        {/* Column 1: Brand */}
                        <div className="col-span-2 md:col-span-4">
                            <Link href="/" className="inline-block transition-transform hover:scale-105">
                                <Logo size="sm" showText variant="full" />
                            </Link>
                            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                                The ultimate stats platform for Ultimate Frisbee. Track every point, assist, and spirit score with precision.
                            </p>
                        </div>

                        {/* Link Columns */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Platform</h3>
                            <ul className="mt-4 space-y-3">
                                {navigation.platform.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Features</h3>
                            <ul className="mt-4 space-y-3">
                                {navigation.features.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Resources</h3>
                            <ul className="mt-4 space-y-3">
                                {navigation.resources.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Account</h3>
                            <ul className="mt-4 space-y-3">
                                {navigation.account.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                            <p>&copy; {new Date().getFullYear()} UltimateStats. All rights reserved.</p>
                            <span className="hidden md:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <div className="flex items-center gap-4">
                                <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                                <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Powered by{' '}
                            <a
                                href="https://codevertexitsolutions.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium inline-block transition-colors"
                            >
                                Codevertex IT Solutions
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className={cn("py-6 md:py-8 border-t bg-background w-full", className)}>
            <div className="container mx-auto px-2 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground text-center md:text-left">
                <p>&copy; {new Date().getFullYear()} UltimateStats. All rights reserved.</p>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                    <p>
                        Powered by{' '}
                        <a
                            href="https://codevertexitsolutions.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium inline-block"
                        >
                            Codevertex IT Solutions
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
