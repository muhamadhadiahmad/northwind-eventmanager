import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8 bg-gradient-subtle min-h-0">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}