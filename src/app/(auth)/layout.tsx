'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/brand/Logo';
import { Radio, BarChart3, Shield, Users, Trophy, Zap, Star } from 'lucide-react';

const features = [
  { icon: Radio, text: 'Real-time live scoring', color: 'from-red-500 to-orange-500' },
  { icon: BarChart3, text: 'Advanced analytics', color: 'from-emerald-500 to-teal-500' },
  { icon: Shield, text: 'Spirit tracking (WFDF)', color: 'from-amber-500 to-yellow-500' },
  { icon: Users, text: 'Team management', color: 'from-pink-500 to-rose-500' },
];

const stats = [
  { value: '500+', label: 'Events' },
  { value: '2K+', label: 'Teams' },
  { value: '50K+', label: 'Games' },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding/Hero (hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/illustrations/hero-pattern.svg')] opacity-10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top section */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-105">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} />
              </div>
              <span className="text-2xl font-bold">UltimateStats</span>
            </Link>

            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Track Scores.
              <br />
              <span className="text-white/90">Elevate Your Game.</span>
            </h1>
            <p className="text-lg xl:text-xl text-white/80 max-w-lg leading-relaxed">
              The ultimate platform for tracking scores, managing events, and sharing live updates
              with your Ultimate Frisbee community.
            </p>
          </div>

          {/* Center - Illustration */}
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="relative">
              <Image
                src="/illustrations/login-hero.svg"
                alt="Sports statistics illustration"
                width={420}
                height={320}
                className="max-w-full h-auto drop-shadow-2xl"
                priority
              />
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-sm font-medium shadow-lg">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span>4.9 Rating</span>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 transition-all hover:bg-white/20 hover:scale-105"
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background">
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b bg-background/95 backdrop-blur-xl sticky top-0 z-10">
          <Link href="/" className="inline-block">
            <Logo size="sm" showText variant="full" />
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden p-4 border-t text-center text-sm text-muted-foreground bg-muted/30">
          <p>&copy; {new Date().getFullYear()} UltimateStats. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
