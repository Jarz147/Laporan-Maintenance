import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { StatusBadge, ShiftBadge } from "../lib/constants";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize, Wrench, ImageIcon, User, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function Presentation() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [idx, setIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
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

  const next = useCallback(() => {
    setImgIdx(0);
    setIdx((i) => (i + 1) % Math.max(reports.length, 1));
  }, [reports.length]);

  const prev = useCallback(() => {
    setImgIdx(0);
    setIdx((i) => (i - 1 + reports.length) % Math.max(reports.length, 1));
  }, [reports.length]);

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
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [autoplay, next, reports.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (reports.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat presentasi...</div>;
  }

  const r = reports[idx];
  const hasImg = r.images.length > 0;
  const currImg = hasImg ? r.images[imgIdx % r.images.length] : null;

  return (
    <div ref={containerRef} data-testid="presentation-container" className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
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
          <Button
            data-testid="autoplay-btn"
            variant="ghost"
            size="sm"
            onClick={() => setAutoplay((a) => !a)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white h-9 gap-1.5"
          >
            {autoplay ? <><Pause className="w-4 h-4" /> Auto</> : <><Play className="w-4 h-4" /> Auto</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-slate-300 hover:bg-slate-800 hover:text-white h-9">
            <Maximize className="w-4 h-4" />
          </Button>
          <Button data-testid="exit-presentation-btn" variant="ghost" size="sm" onClick={() => nav("/")} className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-9 gap-1.5">
            <X className="w-4 h-4" /> Keluar
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-1 bg-slate-900 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${((idx + 1) / reports.length) * 100}%` }}
        />
      </div>

      {/* Slide */}
      <div key={r.id} data-testid="slide-content" className="flex-1 relative z-10 animate-slide-fade grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 lg:p-10 overflow-hidden">
        {/* Image column */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          <div className="flex-1 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative flex items-center justify-center min-h-[280px]">
            {currImg ? (
              <img
                src={fileUrl(currImg.id)}
                alt={r.area}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-700 industrial-stripes w-full h-full justify-center">
                <ImageIcon className="w-16 h-16" />
                <div className="text-xs font-mono uppercase tracking-widest">Tidak ada foto</div>
              </div>
            )}
          </div>
          {r.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {r.images.map((im, i) => (
                <button
                  key={im.id}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${i === imgIdx ? "border-amber-500" : "border-slate-800 opacity-60 hover:opacity-100"}`}
                >
                  <img src={fileUrl(im.id)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            <ShiftBadge value={r.shift} />
            <StatusBadge value={r.status} />
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">// Area / Lokasi</div>
            <h2 className="font-display text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">{r.area}</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono">{r.tanggal}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{r.created_by_name}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Deskripsi Pekerjaan</div>
            <p className="text-slate-200 text-base xl:text-lg leading-relaxed whitespace-pre-wrap">{r.deskripsi}</p>
          </div>

          {r.catatan && (
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">Catatan / Rekomendasi</div>
              <p className="text-slate-200 text-sm xl:text-base leading-relaxed whitespace-pre-wrap">{r.catatan}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav arrows */}
      <button
        data-testid="prev-slide-btn"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 backdrop-blur-md text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all flex items-center justify-center"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        data-testid="next-slide-btn"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 backdrop-blur-md text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all flex items-center justify-center"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom filmstrip */}
      <div className="relative z-10 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {reports.map((rr, i) => (
            <button
              key={rr.id}
              data-testid={`filmstrip-${i}`}
              onClick={() => { setIdx(i); setImgIdx(0); }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${i === idx ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">{i + 1}</span>
              <span className="max-w-[140px] truncate">{rr.area}</span>
            </button>
          ))}
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-2 text-center">
          ← → Navigasi · Space Next · F Fullscreen · Esc Keluar
        </div>
      </div>
    </div>
  );
}
