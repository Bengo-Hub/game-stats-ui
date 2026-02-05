import { PublicHeader } from '@/components/layout/public';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-sm mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/discover" className="hover:text-foreground transition-colors">Discover</a></li>
                <li><a href="/live" className="hover:text-foreground transition-colors">Live Scores</a></li>
                <li><a href="/directory" className="hover:text-foreground transition-colors">Teams</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/leaderboards" className="hover:text-foreground transition-colors">Leaderboards</a></li>
                <li><a href="/analytics" className="hover:text-foreground transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Spirit Scores</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Account</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/login" className="hover:text-foreground transition-colors">Sign In</a></li>
                <li><a href="/login" className="hover:text-foreground transition-colors">Register</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} UltimateStats. All rights reserved.</p>
            <p>
              Made with 💓 by{' '}
              <a
                href="https://codevertexitsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Codevetex IT Solutions
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
