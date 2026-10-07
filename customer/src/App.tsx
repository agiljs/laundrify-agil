import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import CustomerLayout from "./components/CustomerLayout";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import HomePage from "./pages/Home/HomePage";
import OrderNewPage from "./pages/OrderNew/OrderNewPage";
import OrderDetailPage from "./pages/OrderDetail/OrderDetailPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import ProfilePage from "./pages/Profile/ProfilePage";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <CustomerLayout>{children}</CustomerLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Protected><HomePage /></Protected>} />
          <Route path="/orders/new" element={<Protected><OrderNewPage /></Protected>} />
          <Route path="/orders/:id" element={<Protected><OrderDetailPage /></Protected>} />
          <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
