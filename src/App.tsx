import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Company from "./pages/Company";
import Events from "./pages/Events";
import Attendees from "./pages/Attendees";
import CheckIn from "./pages/CheckIn";
import Seating from "./pages/Seating";
import Gallery from "./pages/Gallery";
import Voting from "./pages/Voting";
import PublicRegister from "./pages/PublicRegister";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register/:eventId" element={<PublicRegister />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/company" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Company />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Events />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/attendees" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Attendees />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/checkin" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CheckIn />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/seating" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Seating />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/gallery" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Gallery />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/voting" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Voting />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
