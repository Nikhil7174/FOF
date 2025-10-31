import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Volunteer from "./pages/Volunteer";
import Calendar from "./pages/Calendar";
import Sports from "./pages/Sports";
import Communities from "./pages/Communities";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import Contact from "./pages/Contact";
import CommunitySignup from "./pages/CommunitySignup";
import { AuthProvider, useAuth } from "./hooks/api/useAuth";
import { Footer } from "./components/Footer";
import AdminDashboard from "./pages/admin/Dashboard";
import CommunityDashboard from "./pages/community/Dashboard";

// Minimal protected route gate by role
function ProtectedRoute({ children, role }: { children: React.ReactNode; role: "admin" | "community" }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/community-signup" element={<CommunitySignup />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/communities" element={<Communities />} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute role="community"><CommunityDashboard /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Footer />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
