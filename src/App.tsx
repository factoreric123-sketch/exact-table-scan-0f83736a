import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Preconnect } from "@/components/Preconnect";
import Home from "./pages/Home";
import Demo from "./pages/Demo";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import PublicMenu from "./pages/PublicMenu";
import MenuRedirect from "./pages/MenuRedirect";
import MenuShortDisplay from "./pages/MenuShortDisplay";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import GDPR from "./pages/legal/GDPR";
import BusinessCard from "./pages/BusinessCard";

// Apple-level instant loading configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - menus don't change often
      gcTime: 1000 * 60 * 60 * 2, // 2 hours - aggressive memory cache
      refetchOnWindowFocus: false, // Never refetch on tab switch
      refetchOnMount: false, // Always use cache first - instant
      refetchOnReconnect: false, // Don't auto-refetch
      retry: 0, // Never retry - instant fail for better UX
      networkMode: 'online', // Only fetch when online
      throwOnError: false, // Use error states, never throw
    },
    mutations: {
      retry: 0, // Never retry mutations
      networkMode: 'online',
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Preconnect />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/business-card" element={<BusinessCard />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:restaurantId"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            {/* Canonical route for public menus */}
            <Route path="/menu/:slug" element={<PublicMenu />} />
            {/* Short link format for QR codes */}
            <Route path="/m/:restaurantHash/:menuId" element={<MenuShortDisplay />} />
            {/* Legacy redirect for old QR codes */}
            <Route path="/:slug" element={<MenuRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
