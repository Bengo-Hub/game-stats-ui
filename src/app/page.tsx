import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicHeader } from '@/components/layout/public';
import { Logo } from '@/components/brand/Logo';
import {
  CalendarDays,
  Users,
  BarChart3,
  Radio,
  Zap,
  Globe,
  Shield,
  Trophy,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';

const features = [
  {
    icon: Radio,
    title: 'Live Scoring',
    description: 'Real-time score updates with play-by-play tracking and instant notifications',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: CalendarDays,
    title: 'Event Management',
    description: 'Organize tournaments, leagues, and competitions with powerful scheduling tools',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive player and team statistics with beautiful visualizations',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Spirit Scores',
    description: 'Track sportsmanship with official WFDF spirit scoring system',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Users,
    title: 'Team Profiles',
    description: 'Complete rosters, match history, and performance tracking for every team',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Share events and live scores with fans and spectators worldwide',
    gradient: 'from-sky-500 to-blue-500',
  },
];

const stats = [
  { value: '500+', label: 'Events Tracked', icon: CalendarDays },
  { value: '2,000+', label: 'Teams Registered', icon: Users },
  { value: '50,000+', label: 'Games Scored', icon: Trophy },
  { value: '99.9%', label: 'Uptime', icon: Zap },
];

const testimonials = [
  {
    quote: "UltimateStats transformed how we run our tournaments. The live scoring feature is a game-changer!",
    author: "Sarah Chen",
    role: "Tournament Director",
    avatar: "SC",
  },
  {
    quote: "Finally a platform that understands Ultimate Frisbee. The spirit scoring integration is perfect.",
    author: "Mike Torres",
    role: "League Organizer",
    avatar: "MT",
  },
  {
    quote: "Our players love being able to track their stats in real-time. Highly recommended!",
    author: "Emma Wilson",
    role: "Team Captain",
    avatar: "EW",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          {/* Background gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute inset-0 bg-[url('/illustrations/hero-pattern.svg')] opacity-20" />

          {/* Floating orbs - more subtle */}
          <div className="absolute top-10 left-5 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-5 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative py-12 sm:py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left: Text content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                  <Zap className="h-3.5 w-3.5" />
                  <span>#1 Ultimate Frisbee Stats Platform</span>
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
                  Track Scores.{' '}
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Elevate Your Game.
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  The ultimate platform for live scoring, event management, and real-time updates for your Ultimate Frisbee community.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                  <Link href="/discover">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Browse Events
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/live">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 border-2">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Live
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {['bg-indigo-500', 'bg-purple-500', 'bg-pink-500'].map((bg, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${bg} border-2 border-background flex items-center justify-center text-white text-[10px] font-bold`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs">2,000+ teams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-xs">4.9 rating</span>
                  </div>
                </div>
              </div>

              {/* Right: Dashboard Preview */}
              <div className="relative hidden lg:block">
                {/* Main dashboard card */}
                <div className="relative bg-background/80 backdrop-blur-xl rounded-2xl border shadow-2xl p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Live Tournament</div>
                        <div className="text-xs text-muted-foreground">8 teams · Finals</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                      <span className="text-xs font-medium text-red-500">LIVE</span>
                    </div>
                  </div>

                  {/* Score card */}
                  <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">T1</div>
                        <div>
                          <div className="font-semibold text-sm">Thunder FC</div>
                          <div className="text-xs text-muted-foreground">Offense</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-emerald-500">12</div>
                    </div>
                    <div className="h-px bg-border my-3" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm">T2</div>
                        <div>
                          <div className="font-semibold text-sm">Storm United</div>
                          <div className="text-xs text-muted-foreground">Defense</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold">10</div>
                    </div>
                  </div>

                  {/* Stats preview */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-indigo-500">45</div>
                      <div className="text-[10px] text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-purple-500">23</div>
                      <div className="text-[10px] text-muted-foreground">Assists</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-amber-500">8.5</div>
                      <div className="text-[10px] text-muted-foreground">Spirit</div>
                    </div>
                  </div>
                </div>

                {/* Floating notification card */}
                <div className="absolute -top-4 -right-4 bg-background border rounded-xl shadow-lg p-3 transform -rotate-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">Goal scored!</div>
                      <div className="text-[10px] text-muted-foreground">Thunder FC leads</div>
                    </div>
                  </div>
                </div>

                {/* Floating time card */}
                <div className="absolute -bottom-2 -left-4 bg-background border rounded-xl shadow-lg p-2.5 transform rotate-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-medium">Q4 · 3:42</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-10 sm:py-12 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center group">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <TrendingUp className="h-4 w-4" />
                Features
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  run amazing events
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From small pickup games to national championships, we have the tools to make scoring simple and engaging.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6 sm:p-8">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 sm:py-20 bg-muted/30 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Star className="h-4 w-4" />
                Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Loved by{' '}
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  teams worldwide
                </span>
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-[url('/illustrations/hero-pattern.svg')] opacity-10" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Image src="/illustrations/trophy.svg" alt="" width={32} height={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Ready to elevate your events?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-6 max-w-xl mx-auto">
              Join thousands of organizers using UltimateStats to run professional-quality tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base h-14 px-8 font-semibold">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/discover">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base h-14 px-8 bg-transparent border-2 border-white/30 text-white hover:bg-white/10"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Explore Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" showText variant="full" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                The ultimate stats platform for Ultimate Frisbee.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/discover" className="hover:text-foreground transition-colors">Events</Link></li>
                <li><Link href="/live" className="hover:text-foreground transition-colors">Live Scores</Link></li>
                <li><Link href="/directory" className="hover:text-foreground transition-colors">Teams</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-4">Features</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/leaderboards" className="hover:text-foreground transition-colors">Leaderboards</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Spirit Scores</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-4">Account</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Register</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} UltimateStats. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
