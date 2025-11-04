import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  try {
    const { user, loading } = useAuth();
    const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

    if (!user) {
      // Save the intended destination
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // If AuthContext is not available, redirect to auth page
    console.error("Auth context error:", error);
    return <Navigate to="/auth" replace />;
  }
};
