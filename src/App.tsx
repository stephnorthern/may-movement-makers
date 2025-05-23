import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataLoadingProvider } from './contexts/DataLoadingContext';
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import NewActivity from "./pages/NewActivity";
import Participants from "./pages/Participants";
import Calendar from "./pages/Calendar";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DataLoadingProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/activities/new" element={<NewActivity />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/calendar" element={<Calendar />} />
              </Route>
              <Route 
                path="/participants-redirect" 
                element={
                  sessionStorage.getItem('viewing_participants') === 'true'
                    ? <Navigate to="/participants" replace />
                    : <Navigate to="/" replace />
                } 
              />
              <Route
                path="/participants/*"
                element={<Navigate to="/participants" replace />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataLoadingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
