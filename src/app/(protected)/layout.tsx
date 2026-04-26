import TopNav from '@/components/TopNav';
import SupabaseBootstrap from '@/components/SupabaseBootstrap';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col bg-beige">
      <SupabaseBootstrap />
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
