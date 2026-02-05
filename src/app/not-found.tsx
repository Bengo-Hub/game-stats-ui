'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft, Compass } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="h-10 w-10 text-indigo-500" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            {/* Show Dashboard link only for authenticated users */}
            {isAuthenticated ? (
              <Button asChild className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Link href="/discover">
                  <Compass className="h-4 w-4 mr-2" />
                  Browse Events
                </Link>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            {!isAuthenticated && (
              <Button variant="ghost" asChild className="w-full">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Error 404 - Page not found
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
