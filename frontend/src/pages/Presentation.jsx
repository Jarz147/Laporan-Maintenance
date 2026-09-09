import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { ShiftBadge } from "../lib/constants";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ActivityGallery } from "../components/ActivityGallery";

const STAMP = {
  selesai: { text: "CASE CLOSED", color: "text-emerald-500 border-emerald-500" },
  pending: { text: "PENDING", color: "text-amber-500 border-amber-500" },
  progress: { text: "ON PROCESS", color: "text-blue-500 border-blue-500" },
  issue: { text: "CRITICAL", color: "text-rose-500 border-rose-500" },
};

function StatusStamp({ status }) {
  const s = STAMP[status] || STAMP.pending;
  return (
    <div className={`inline-block border-[3px] ${s.color} px-4 py-2 rounded-md -rotate-6 font-display font-extrabold text-base sm:text-lg tracking-widest bg-white/5 shadow-2xl`}>
      {s.text}
    </div>
  );
}

export default function Presentation() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const oneId = sp.get("id");
        if (oneId) {
          const { data } = await api.get(`/reports/${oneId}`);
          setReports([data]);
        } else {
          const params = {};
          const shift = sp.get("shift"); const status = sp.get("status"); const q = sp.get("q");
          if (shift && shift !== "all") params.shift = shift;
          if (status && status !== "all") params.status = status;
          if (q) params.q = q;
          const { data } = await api.get("/reports", { params });
          if (data.length === 0) {
            toast.info("Tidak ada laporan untuk ditampilkan");
            nav("/");
            return;
          }
          setReports(data);
        }
      } catch (e) {
        toast.error("Gagal memuat laporan");
        nav("/");
      }
    })();
  }, []);

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(reports.length, 1)), [reports.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + reports.length) % Math.max(reports.length, 1)), [reports.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") { nav("/"); }
      else if (e.key === "f" || e.key === "F") { toggleFullscreen(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!autoplay || reports.length === 0) return;
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [autoplay, next, reports.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (reports.length === 0)
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat presentasi...</div>;

  const r = reports[idx];

  return (
    <div ref={containerRef} data-testid="presentation-container" className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white leading-tight">MODE PRESENTASI</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Serah Terima Shift</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div data-testid="slide-counter" className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700">
            <span className="text-white font-bold">{idx + 1}</span> <span className="text-slate-600">/</span> {reports.length}
          </div>
          <Button data-testid="autoplay-btn" variant="ghost" size="sm" onClick={() => setAutoplay((a) => !a)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white h-9 gap-1.5">
            {autoplay ? <><Pause className="w-4 h-4" /> Auto</> : <><Play className="w-4 h-4" /> Auto</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-slate-300 hover:bg-slate-800 hover:text-white h-9">
            <Maximize className="w-4 h-4" />
          </Button>
          <Button data-testid="exit-presentation-btn" variant="ghost" size="sm" onClick={() => nav("/")}
            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-9 gap-1.5">
            <X className="w-4 h-4" /> Keluar
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-1 bg-slate-900 overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${((idx + 1) / reports.length) * 100}%` }} />
      </div>

      {/* Slide */}
      <div key={r.id} data-testid="slide-content" className="flex-1 relative z-10 animate-slide-fade overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Slide title */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <ShiftBadge value={r.shift} />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{r.tanggal}</span>
          <span className="text-slate-700">·</span>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{r.area}</h1>
        </div>

        {/* PPT-style table */}
        <div className="rounded-lg overflow-hidden border-2 border-emerald-700/80 shadow-2xl bg-slate-900">
          {/* Column headers */}
          <div className="grid grid-cols-2 lg:grid-cols-12 bg-emerald-700 text-white text-xs sm:text-sm font-bold font-display uppercase tracking-wide">
            <HeaderCell className="lg:col-span-2">Keterangan</HeaderCell>
            <HeaderCell className="lg:col-span-3">What (Problem)</HeaderCell>
            <HeaderCell className="lg:col-span-3">How (Activity)</HeaderCell>
            <HeaderCell className="lg:col-span-2">Dikerjakan</HeaderCell>
            <HeaderCell className="lg:col-span-2 border-r-0">Status</HeaderCell>
          </div>

          {/* Row content */}
          <div className="grid grid-cols-2 lg:grid-cols-12 text-white">
            {/* KETERANGAN */}
            <Cell className="lg:col-span-2">
              <div className="space-y-1.5 text-sm">
                <KV k="Line" v={r.line} />
                <KV k="Mesin" v={r.mesin} />
                <KV k="Jig" v={r.jig} />
              </div>
            </Cell>
            {/* PROBLEM */}
            <Cell className="lg:col-span-3">
              {r.problems?.length > 0 ? (
                <ol className="space-y-1.5 text-sm text-slate-100">
                  {r.problems.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-rose-400 font-mono font-bold shrink-0 min-w-[24px]">{toRoman(i + 1)}.</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="text-slate-600 italic text-sm">-</span>
              )}
            </Cell>
            {/* ACTIVITY */}
            <Cell className="lg:col-span-3">
              {r.activities?.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-slate-100">
                  {r.activities.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-400 shrink-0 text-lg leading-none pt-0.5">•</span>
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-600 italic text-sm">-</span>
              )}
            </Cell>
            {/* DIKERJAKAN */}
            <Cell className="lg:col-span-2">
              <div className="space-y-1.5 text-sm">
                <KV k="Who" v={r.who || r.created_by_name} />
                <KV k="Time" v={r.time} />
              </div>
            </Cell>
            {/* STATUS */}
            <Cell className="lg:col-span-2 border-r-0 flex items-center justify-center py-6">
              <StatusStamp status={r.status} />
            </Cell>
          </div>

          {/* Activity header */}
          <div className="bg-emerald-700 text-white text-center px-4 py-1.5 font-display font-bold uppercase tracking-widest text-sm">
            Activity
          </div>

          {/* Activity images */}
          <div className="bg-slate-900 p-4">
            <ActivityGallery images={r.images || []} testidPrefix="slide-activity" />
          </div>
        </div>

        {r.status === "issue" && r.kendala && (
          <div data-testid="slide-kendala" className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-rose-400">Kendala</div>
            </div>
            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{r.kendala}</p>
          </div>
        )}

        {r.catatan && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1.5">Catatan / Rekomendasi</div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{r.catatan}</p>
          </div>
        )}
      </div>

      {/* Nav arrows */}
      <button data-testid="prev-slide-btn" onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 backdrop-blur-md text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all flex items-center justify-center">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button data-testid="next-slide-btn" onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 backdrop-blur-md text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all flex items-center justify-center">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Filmstrip */}
      <div className="relative z-10 border-t border-slate-800 bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="flex gap-2 overflow-x-auto">
          {reports.map((rr, i) => (
            <button key={rr.id} data-testid={`filmstrip-${i}`} onClick={() => setIdx(i)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${i === idx ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">{i + 1}</span>
              <span className="max-w-[140px] truncate">{rr.area}</span>
            </button>
          ))}
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-1.5 text-center">
          ← → Navigasi · Space Next · F Fullscreen · Esc Keluar
        </div>
      </div>
    </div>
  );
}

function HeaderCell({ children, className = "" }) {
  return <div className={`px-3 py-2 border-r border-emerald-600 ${className}`}>{children}</div>;
}

function Cell({ children, className = "" }) {
  return <div className={`px-3 py-3 border-r border-slate-700/60 border-t border-slate-700/40 ${className}`}>{children}</div>;
}

function KV({ k, v }) {
  return (
    <div className="flex gap-1.5">
      <span className="font-bold text-white shrink-0 w-12">{k}</span>
      <span className="text-slate-500">:</span>
      <span className="text-slate-200 break-words">{v || "-"}</span>
    </div>
  );
}

function toRoman(num) {
  const map = [["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]];
  let n = num, out = "";
  for (const [r, v] of map) { while (n >= v) { out += r; n -= v; } }
  return out || String(num);
}
