import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { ArrowLeft, Package, Search, Calendar as CalendarIcon, Cog, Wrench } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { ShiftBadge } from "../lib/constants";

export default function SpareHistory() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/spareparts/history");
        setItems(data);
      } catch (e) {
        toast.error("Gagal memuat riwayat sparepart");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((it) =>
      (it.sparepart || "").toLowerCase().includes(s) ||
      (it.report_area || "").toLowerCase().includes(s) ||
      (it.line || "").toLowerCase().includes(s) ||
      (it.mesin || "").toLowerCase().includes(s) ||
      (it.jig || "").toLowerCase().includes(s) ||
      (Array.isArray(it.who) ? it.who.join(",") : (it.who || "")).toLowerCase().includes(s)
    );
  }, [items, q]);

  const summary = useMemo(() => {
    const counter = {};
    for (const it of items) {
      const key = (it.sparepart || "").trim();
      if (!key) continue;
      counter[key] = (counter[key] || 0) + 1;
    }
    return Object.entries(counter).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [items]);

  const fmtDate = (t) => {
    try { return format(new Date(t + "T00:00:00"), "d MMM yyyy", { locale: idLocale }); }
    catch { return t; }
  };

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button data-testid="back-btn" variant="ghost" onClick={() => nav("/")}
            className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            <Package className="w-3.5 h-3.5" /> Riwayat Sparepart
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
            // Log Penggantian Part
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Riwayat Sparepart</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Semua penggantian sparepart otomatis tercatat di sini setiap kali laporan disimpan. Total <span className="text-emerald-400 font-mono">{items.length}</span> catatan.
          </p>
        </div>

        {summary.length > 0 && (
          <Card className="bg-slate-900/60 border-slate-800 p-5 mb-6">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">Top 5 Part Paling Sering Diganti</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {summary.map(([name, count], i) => (
                <div key={name} className="p-3 rounded-md bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">#{i + 1}</div>
                  <div className="text-sm text-white font-medium truncate">{name}</div>
                  <div className="text-xs text-emerald-400 font-mono mt-1">{count}× diganti</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input data-testid="search-sparepart" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Cari sparepart, area, line, mesin, jig, operator..."
            className="pl-10 bg-slate-900/60 border-slate-800 h-10 text-white placeholder:text-slate-600" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Package className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <div className="text-slate-400 mb-1">Belum ada riwayat penggantian sparepart.</div>
            <div className="text-xs text-slate-600">Sparepart akan tercatat otomatis saat kamu simpan laporan dengan field sparepart terisi.</div>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-900 text-[10px] font-mono uppercase tracking-widest text-slate-500 px-4 py-2.5 border-b border-slate-800">
              <div className="col-span-4">Sparepart</div>
              <div className="col-span-2">Tanggal</div>
              <div className="col-span-2">Line / Mesin</div>
              <div className="col-span-3">Area</div>
              <div className="col-span-1 text-right">Shift</div>
            </div>
            <div className="divide-y divide-slate-800" data-testid="sparepart-list">
              {filtered.map((it) => (
                <div key={it.id} data-testid={`sp-row-${it.id}`}
                  className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-900/60 transition-colors">
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">{it.sparepart}</div>
                      <div className="text-[10px] text-slate-600 font-mono truncate">
                        {Array.isArray(it.who) && it.who.length > 0 ? it.who.join(", ") : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-slate-300 font-mono flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-slate-600" />
                    {fmtDate(it.tanggal)}
                  </div>
                  <div className="col-span-2 text-xs text-slate-300 space-y-0.5">
                    {it.line && <div className="flex items-center gap-1"><Wrench className="w-3 h-3 text-slate-600" /> {it.line}</div>}
                    {it.mesin && <div className="flex items-center gap-1"><Cog className="w-3 h-3 text-slate-600" /> {it.mesin}</div>}
                  </div>
                  <div className="col-span-3 text-xs text-slate-400 truncate">
                    <button onClick={() => nav(`/reports/${it.report_id}`)}
                      className="hover:text-amber-400 hover:underline text-left truncate max-w-full">
                      {it.report_area || "—"}
                    </button>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ShiftBadge value={it.shift} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
