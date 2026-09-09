import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { StatusBadge, ShiftBadge } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ArrowLeft, Pencil, MonitorPlay, Calendar, MapPin, User, FileText, StickyNote, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function ReportDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data);
      } catch (e) {
        toast.error("Laporan tidak ditemukan");
        nav("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat...</div>;
  if (!report) return null;

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button variant="ghost" onClick={() => nav("/")} className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              data-testid="detail-present-btn"
              onClick={() => nav(`/present?id=${report.id}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-9"
            >
              <MonitorPlay className="w-4 h-4" /> Presentasi
            </Button>
            <Button
              data-testid="detail-edit-btn"
              onClick={() => nav(`/reports/${report.id}/edit`)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 font-bold h-9"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ShiftBadge value={report.shift} />
            <StatusBadge value={report.status} />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{report.tanggal}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">{report.area}</h1>
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Oleh: {report.created_by_name}
          </div>
        </div>

        {/* Images */}
        {report.images.length > 0 && (
          <Card className="bg-slate-900/60 border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Foto Dokumentasi ({report.images.length})</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {report.images.map((img, idx) => (
                <button
                  key={img.id}
                  data-testid={`detail-image-${idx}`}
                  onClick={() => setLightbox(img)}
                  className="aspect-square rounded-lg overflow-hidden bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all group"
                >
                  <img src={fileUrl(img.id)} alt={img.original_filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Details */}
        <div className="grid gap-4">
          <Card className="bg-slate-900/60 border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Deskripsi Pekerjaan</div>
            </div>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{report.deskripsi}</p>
          </Card>

          {report.catatan && (
            <Card className="bg-slate-900/60 border-slate-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Catatan / Rekomendasi</div>
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{report.catatan}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniField icon={<Calendar className="w-3.5 h-3.5" />} label="Tanggal" value={report.tanggal} />
            <MiniField icon={<MapPin className="w-3.5 h-3.5" />} label="Area" value={report.area} />
            <MiniField icon={<User className="w-3.5 h-3.5" />} label="Dibuat Oleh" value={report.created_by_name} />
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={fileUrl(lightbox.id)} alt={lightbox.original_filename} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

function MiniField({ icon, label, value }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm text-white font-medium truncate">{value}</div>
    </div>
  );
}
