import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { StatusBadge, ShiftBadge, STATUS_MAP } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "../components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "../components/ui/alert-dialog";
import {
  Wrench, Plus, Search, Filter, MonitorPlay, LogOut, Pencil, Trash2, Eye, ImageIcon,
  CheckCircle2, Clock, AlertTriangle, Cog, HardHat, ChevronDown, Calendar as CalendarIcon, Database, X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function Dashboard() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [shift, setShift] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activePreset, setActivePreset] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (shift !== "all") params.shift = shift;
      if (status !== "all") params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const [r, s] = await Promise.all([
        api.get("/reports", { params }),
        api.get("/reports/stats"),
      ]);
      setReports(r.data);
      setStats(s.data);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [q, shift, status, dateFrom, dateTo]);

  const setPreset = (preset) => {
    const fmtD = (d) => format(d, "yyyy-MM-dd");
    const today = new Date();
    setActivePreset(preset);
    if (preset === "all") { setDateFrom(""); setDateTo(""); return; }
    if (preset === "today") { const t = fmtD(today); setDateFrom(t); setDateTo(t); return; }
    if (preset === "week") { const d = new Date(); d.setDate(d.getDate() - 6); setDateFrom(fmtD(d)); setDateTo(fmtD(today)); return; }
    if (preset === "month") { const d = new Date(); d.setDate(d.getDate() - 29); setDateFrom(fmtD(d)); setDateTo(fmtD(today)); return; }
  };

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    try {
      await api.delete(`/reports/${id}`);
      toast.success("Laporan dihapus");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menghapus");
    }
  };

  const doLogout = async () => { await logout(); nav("/login"); };

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-amber-500 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-sm font-bold text-white leading-tight">SANKEI MAINTENANCE</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Daily Report</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              data-testid="master-data-btn"
              variant="ghost"
              onClick={() => nav("/master")}
              className="text-slate-300 hover:bg-slate-800 hover:text-white h-9 gap-1.5 px-3"
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Master Data</span>
            </Button>
            <Button
              data-testid="present-mode-btn"
              onClick={() => nav(`/present?shift=${shift}&status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium h-9"
            >
              <MonitorPlay className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Presentasi</span>
            </Button>
            <Button
              data-testid="new-report-btn"
              onClick={() => nav("/reports/new")}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 gap-2 font-bold h-9"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Laporan Baru</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-trigger" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {user?.shift === "shift1" && <HardHat className="w-3.5 h-3.5 text-amber-400" />}
                    {user?.shift === "shift2" && <Cog className="w-3.5 h-3.5 text-indigo-400" />}
                    {user?.shift === "admin" && <Wrench className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-white leading-tight">{user?.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{user?.shift}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <DropdownMenuLabel>
                  <div className="text-white">{user?.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  data-testid="logout-btn"
                  onClick={doLogout}
                  className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Hero + KPI */}
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
            // Dashboard Operasional
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
            Laporan Harian <span className="text-amber-400">Maintenance</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })} · Selamat datang, <span className="text-white font-medium">{user?.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
          <KPI icon={<CalendarIcon className="w-4 h-4" />} label="Hari Ini" value={stats.today || 0} color="text-white" testid="kpi-today" />
          <KPI icon={<Wrench className="w-4 h-4" />} label="Total" value={stats.total || 0} color="text-white" testid="kpi-total" />
          <KPI icon={<CheckCircle2 className="w-4 h-4" />} label="Selesai" value={stats.selesai || 0} color="text-emerald-400" testid="kpi-selesai" />
          <KPI icon={<Clock className="w-4 h-4" />} label="Pending" value={stats.pending || 0} color="text-amber-400" testid="kpi-pending" />
          <KPI icon={<AlertTriangle className="w-4 h-4" />} label="Kendala" value={stats.issue || 0} color="text-rose-400" testid="kpi-issue" />
          <KPI icon={<Cog className="w-4 h-4" />} label="Proses" value={stats.progress || 0} color="text-blue-400" testid="kpi-progress" />
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 sm:p-4 mb-6 space-y-3">
          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mr-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" /> Periode:
            </div>
            {[["all", "Semua"], ["today", "Hari Ini"], ["week", "7 Hari"], ["month", "30 Hari"]].map(([k, l]) => (
              <button key={k} type="button" data-testid={`preset-${k}`} onClick={() => setPreset(k)}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-colors border ${activePreset === k ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"}`}>
                {l}
              </button>
            ))}
            <div className="flex items-center gap-1.5 lg:ml-auto flex-wrap">
              <Input data-testid="date-from" type="date" value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setActivePreset(""); }}
                className="bg-slate-950 border-slate-800 text-white h-8 text-xs w-auto" />
              <span className="text-slate-500 text-xs">—</span>
              <Input data-testid="date-to" type="date" value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setActivePreset(""); }}
                className="bg-slate-950 border-slate-800 text-white h-8 text-xs w-auto" />
              {(dateFrom || dateTo) && (
                <button type="button" data-testid="clear-date-btn" onClick={() => setPreset("all")}
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-8 w-8 rounded-md flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          {/* Search + filters */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                data-testid="search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari area, deskripsi, catatan..."
                className="pl-10 bg-slate-950 border-slate-800 h-10 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 lg:flex gap-2">
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger data-testid="filter-shift" className="w-full lg:w-48 bg-slate-950 border-slate-800 text-white h-10">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <SelectValue placeholder="Semua Shift" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">Semua Shift</SelectItem>
                  <SelectItem value="shift1">Shift 1 (Pagi)</SelectItem>
                  <SelectItem value="shift2">Shift 2 (Malam)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="filter-status" className="w-full lg:w-48 bg-slate-950 border-slate-800 text-white h-10">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">Memuat data...</div>
        ) : reports.length === 0 ? (
          <div data-testid="empty-state" className="text-center py-20 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Wrench className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <div className="text-slate-400 mb-1">Belum ada laporan.</div>
            <div className="text-xs text-slate-600 mb-4">Buat laporan pertama untuk memulai.</div>
            <Button onClick={() => nav("/reports/new")} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Laporan Baru
            </Button>
          </div>
        ) : (
          <div data-testid="reports-grid" className="space-y-8">
            {groupByDate(reports).map(([tanggal, group], gi) => (
              <div key={tanggal} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                      {formatDateHeader(tanggal)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{group.length} laporan</span>
                  <div className="flex-1 h-px bg-slate-800/60" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.map((r, idx) => (
                    <ReportCard key={r.id} r={r} idx={gi * 100 + idx} onDelete={del}
                      canDelete={user?.role === "admin" || r.created_by === user?.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function groupByDate(reports) {
  const map = {};
  for (const r of reports) {
    if (!map[r.tanggal]) map[r.tanggal] = [];
    map[r.tanggal].push(r);
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateHeader(tanggal) {
  try {
    return format(new Date(tanggal + "T00:00:00"), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return tanggal;
  }
}

function KPI({ icon, label, value, color, testid }) {
  return (
    <Card data-testid={testid} className="bg-slate-900/60 border-slate-800 p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className={`font-display text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
    </Card>
  );
}

function ReportCard({ r, idx, onDelete, canDelete }) {
  const nav = useNavigate();
  return (
    <Card data-testid={`report-card-${idx}`} className="bg-slate-900/60 border-slate-800 overflow-hidden group hover:border-amber-500/40 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800">
        {r.images.length > 0 ? (
          <img
            src={fileUrl(r.images[0].id)}
            alt={r.area}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center industrial-stripes">
            <ImageIcon className="w-8 h-8 text-slate-700" />
          </div>
        )}
        {r.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white border border-slate-700">
            +{r.images.length - 1} foto
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <ShiftBadge value={r.shift} />
          <StatusBadge value={r.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-0.5">{r.tanggal}</div>
            <h3 className="font-display text-lg font-semibold text-white truncate">{r.area}</h3>
          </div>
        </div>
        {(r.line || r.mesin || r.jig) && (
          <div className="text-[11px] font-mono space-y-0.5">
            {r.line && <div><span className="text-slate-500">Line:</span> <span className="text-slate-200">{r.line}</span></div>}
            {r.mesin && <div><span className="text-slate-500">Mesin:</span> <span className="text-slate-200">{r.mesin}</span></div>}
            {r.jig && <div><span className="text-slate-500">Jig:</span> <span className="text-slate-200">{r.jig}</span></div>}
          </div>
        )}
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {r.problems?.length > 0 ? r.problems[0] : r.deskripsi}
        </p>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
          Oleh: {r.created_by_name}{r.who ? ` · Who: ${r.who}` : ""}
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
          <Button
            data-testid={`view-report-${idx}`}
            size="sm"
            variant="ghost"
            onClick={() => nav(`/reports/${r.id}`)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white h-8 gap-1.5 flex-1"
          >
            <Eye className="w-3.5 h-3.5" /> Detail
          </Button>
          <Button
            data-testid={`edit-report-${idx}`}
            size="sm"
            variant="ghost"
            onClick={() => nav(`/reports/${r.id}/edit`)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white h-8 gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button data-testid={`delete-report-${idx}`} size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-8 gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Hapus laporan?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Laporan "{r.area}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">Batal</AlertDialogCancel>
                  <AlertDialogAction data-testid={`confirm-delete-${idx}`} onClick={() => onDelete(r.id)} className="bg-rose-600 hover:bg-rose-500 text-white">Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </Card>
  );
}
