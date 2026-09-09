import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { HardHat, Wrench, Cog } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Login berhasil");
      nav("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 grain-overlay">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left panel — industrial branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 border-r border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-500 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-slate-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white">SANKEI MAINTENANCE</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Daily Report System</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono uppercase tracking-widest text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Sistem Aktif
            </div>
            <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
              Laporan Harian<br/>
              <span className="text-amber-400">Maintenance</span><br/>
              Terpusat.
            </h1>
            <p className="text-slate-400 text-base max-w-md leading-relaxed">
              Catat setiap laporan pekerjaan maintenance per shift. Presentasikan hasil serah terima layaknya PPT — cukup satu klik.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/60">
            <div>
              <div className="font-display text-2xl font-bold text-white">2</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Shift Aktif</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">∞</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Foto/Report</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">PPT</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Mode Presentasi</div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-display text-base font-bold text-white">SANKEI MAINTENANCE</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Daily Report System</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-3">
                // Akses Terbatas
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-2">Masuk Sistem</h2>
              <p className="text-sm text-slate-400">Gunakan akun shift yang telah disediakan admin.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-slate-400 font-mono">Email</Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-900/60 border-slate-800 h-12 text-white placeholder:text-slate-600"
                  placeholder="shift1@sankeidharma.co.id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-slate-400 font-mono">Password</Label>
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/60 border-slate-800 h-12 text-white placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div data-testid="login-error" className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                data-testid="login-submit-btn"
                disabled={loading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-display text-base uppercase tracking-wider rounded-md transition-all disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <div className="pt-6 border-t border-slate-800/60">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Akses Cepat (Demo)</div>
              <div className="grid gap-2">
                <button
                  type="button"
                  data-testid="quick-shift1-btn"
                  onClick={() => quickFill("shift1@sankeidharma.co.id", "shift1pass")}
                  className="flex items-center gap-3 p-3 rounded-md bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-colors text-left"
                >
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">Shift 1 Operator</div>
                    <div className="text-[10px] font-mono text-slate-500">shift1@sankeidharma.co.id</div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/70 uppercase">Isi</span>
                </button>
                <button
                  type="button"
                  data-testid="quick-shift2-btn"
                  onClick={() => quickFill("shift2@sankeidharma.co.id", "shift2pass")}
                  className="flex items-center gap-3 p-3 rounded-md bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-colors text-left"
                >
                  <Cog className="w-4 h-4 text-indigo-400" />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">Shift 2 Operator</div>
                    <div className="text-[10px] font-mono text-slate-500">shift2@sankeidharma.co.id</div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400/70 uppercase">Isi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
