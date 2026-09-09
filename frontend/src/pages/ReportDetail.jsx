import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { ShiftBadge } from "../lib/constants";
import { Button } from "../components/ui/button";
import { ArrowLeft, Pencil, MonitorPlay, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ActivityGallery } from "../components/ActivityGallery";

const STAMP = {
  selesai: { text: "CLOSE", color: "text-emerald-500 border-emerald-500" },
  pending: { text: "PENDING", color: "text-amber-500 border-amber-500" },
  progress: { text: "ON PROGRESS", color: "text-blue-500 border-blue-500" },
  issue: { text: "OPEN", color: "text-rose-500 border-rose-500" },
};

function StatusStamp({ status }) {
  const s = STAMP[status] || STAMP.pending;
  return (
    <div className={`inline-block border-[3px] ${s.color} px-4 py-2 rounded-md -rotate-6 font-display font-extrabold text-base sm:text-lg tracking-widest bg-white/5 shadow-2xl`}>
      {s.text}
    </div>
  );
}

function toRoman(num) {
  const map = [["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]];
  let n = num, out = "";
  for (const [r, v] of map) { while (n >= v) { out += r; n -= v; } }
  return out || String(num);
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

export default function ReportDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setR(data);
      } catch (e) {
        toast.error("Laporan tidak ditemukan");
        nav("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat...</div>;
  if (!r) return null;

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button variant="ghost" onClick={() => nav("/")}
            className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto flex gap-2">
            <Button data-testid="detail-present-btn" onClick={() => nav(`/present?id=${r.id}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-9">
              <MonitorPlay className="w-4 h-4" /> Presentasi
            </Button>
            <Button data-testid="detail-edit-btn" onClick={() => nav(`/reports/${r.id}/edit`)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 font-bold h-9">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <ShiftBadge value={r.shift} />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{r.tanggal}</span>
            <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">· Oleh: {r.created_by_name}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{r.area}</h1>
        </div>

        {/* PPT-style table */}
        <div className="rounded-lg overflow-hidden border-2 border-emerald-700/80 shadow-2xl bg-slate-900">
          <div className="grid grid-cols-2 lg:grid-cols-12 bg-emerald-700 text-white text-xs sm:text-sm font-bold font-display uppercase tracking-wide">
            <HeaderCell className="lg:col-span-2">Keterangan</HeaderCell>
            <HeaderCell className="lg:col-span-3">What (Problem)</HeaderCell>
            <HeaderCell className="lg:col-span-3">How (Activity)</HeaderCell>
            <HeaderCell className="lg:col-span-2">Dikerjakan</HeaderCell>
            <HeaderCell className="lg:col-span-2 border-r-0">Status</HeaderCell>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-12 text-white">
            <Cell className="lg:col-span-2">
              <div className="space-y-1.5 text-sm">
                <KV k="Line" v={r.line} />
                <KV k="Mesin" v={r.mesin} />
                <KV k="Jig" v={r.jig} />
              </div>
            </Cell>
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
              ) : <span className="text-slate-600 italic text-sm">-</span>}
            </Cell>
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
              ) : <span className="text-slate-600 italic text-sm">-</span>}
            </Cell>
            <Cell className="lg:col-span-2">
              <div className="space-y-1.5 text-sm">
                <KV k="Who" v={Array.isArray(r.who) ? (r.who.join(", ") || r.created_by_name) : (r.who || r.created_by_name)} />
                <KV k="Stopline" v={r.stopline ? `${r.stopline} menit` : (r.time || "")} />
              </div>
            </Cell>
            <Cell className="lg:col-span-2 border-r-0 flex items-center justify-center py-6">
              <StatusStamp status={r.status} />
            </Cell>
          </div>

          <div className="bg-emerald-700 text-white text-center px-4 py-1.5 font-display font-bold uppercase tracking-widest text-sm">
            Activity
          </div>
          <div className="bg-slate-900 p-4">
            <ActivityGallery images={r.images || []} testidPrefix="detail-image" />
          </div>
        </div>

        {r.spareparts?.length > 0 && (
          <div data-testid="detail-spareparts" className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">Penggantian Sparepart</div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-slate-100">
              {r.spareparts.map((sp, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-400 pt-0.5">▸</span>
                  <span>{sp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {r.status === "issue" && r.kendala && (
          <div data-testid="detail-kendala" className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-rose-400">Kendala</div>
            </div>
            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{r.kendala}</p>
          </div>
        )}

        {r.catatan && (
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1.5">Catatan / Rekomendasi</div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{r.catatan}</p>
          </div>
        )}

        {r.deskripsi && (
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-1.5">Ringkasan / Deskripsi</div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{r.deskripsi}</p>
          </div>
        )}
      </main>

    </div>
  );
}
