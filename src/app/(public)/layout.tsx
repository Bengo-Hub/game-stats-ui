import { Footer } from '@/components/layout/footer';
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
      <Footer variant="full" />
    </div>
  );
}
