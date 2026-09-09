import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ReportForm from "@/pages/ReportForm";
import ReportDetail from "@/pages/ReportDetail";
import Presentation from "@/pages/Presentation";
import MasterData from "@/pages/MasterData";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat sesi...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat sesi...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/reports/new" element={<Protected><ReportForm /></Protected>} />
            <Route path="/reports/:id" element={<Protected><ReportDetail /></Protected>} />
            <Route path="/reports/:id/edit" element={<Protected><ReportForm /></Protected>} />
            <Route path="/present" element={<Protected><Presentation /></Protected>} />
            <Route path="/master" element={<Protected><MasterData /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </div>
  );
}

export default App;
