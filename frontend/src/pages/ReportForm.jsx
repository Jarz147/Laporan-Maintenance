import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fileUrl, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";
import { STATUS_MAP } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import { ArrowLeft, Save, Upload, X, ImagePlus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReportForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    shift: user?.shift === "shift2" ? "shift2" : "shift1",
    area: "",
    deskripsi: "",
    status: "pending",
    catatan: "",
    images: [],
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/reports/${id}`);
        setForm({
          tanggal: data.tanggal,
          shift: data.shift,
          area: data.area,
          deskripsi: data.deskripsi,
          status: data.status,
          catatan: data.catatan || "",
          images: data.images || [],
        });
      } catch (e) {
        toast.error("Laporan tidak ditemukan");
        nav("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const arr = Array.from(files);
    const uploaded = [];
    for (const f of arr) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        uploaded.push(data);
      } catch (e) {
        toast.error(`Gagal upload ${f.name}: ${formatApiErrorDetail(e.response?.data?.detail) || e.message}`);
      }
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    setUploading(false);
    if (uploaded.length) toast.success(`${uploaded.length} foto diunggah`);
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/reports/${id}`, form);
        toast.success("Laporan berhasil diperbarui");
      } else {
        await api.post("/reports", form);
        toast.success("Laporan berhasil disimpan");
      }
      nav("/");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat...</div>;

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => nav("/")}
            className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto text-xs font-mono uppercase tracking-widest text-slate-500">
            {isEdit ? "Edit Laporan" : "Laporan Baru"}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
            // {isEdit ? "Perbarui Laporan Maintenance" : "Buat Laporan Maintenance"}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {isEdit ? "Edit Laporan" : "Laporan Harian Baru"}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Informasi Dasar</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldWrap label="Tanggal">
                <Input
                  data-testid="form-tanggal"
                  type="date"
                  required
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white h-11"
                />
              </FieldWrap>
              <FieldWrap label="Shift">
                <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v })}>
                  <SelectTrigger data-testid="form-shift" className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="shift1">Shift 1 (Pagi)</SelectItem>
                    <SelectItem value="shift2">Shift 2 (Malam)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="form-status" className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrap>
            </div>

            <FieldWrap label="Area / Lokasi">
              <Input
                data-testid="form-area"
                required
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="cth: Line Stamping A, CNC Workshop, Utility Boiler..."
                className="bg-slate-950 border-slate-800 text-white h-11"
              />
            </FieldWrap>

            <FieldWrap label="Deskripsi Pekerjaan">
              <Textarea
                data-testid="form-deskripsi"
                required
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Jelaskan pekerjaan yang dilakukan, temuan, tindakan..."
                rows={5}
                className="bg-slate-950 border-slate-800 text-white resize-none"
              />
            </FieldWrap>

            <FieldWrap label="Catatan / Rekomendasi">
              <Textarea
                data-testid="form-catatan"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="Catatan tambahan, rekomendasi untuk shift berikutnya, spare part..."
                rows={3}
                className="bg-slate-950 border-slate-800 text-white resize-none"
              />
            </FieldWrap>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ImagePlus className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Foto Dokumentasi</div>
            </div>

            <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-lg py-8 cursor-pointer hover:border-amber-500/60 hover:bg-slate-900 transition-all">
              <input
                data-testid="form-file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
              <Upload className={`w-8 h-8 mb-2 ${uploading ? "text-slate-600 animate-pulse" : "text-slate-500"}`} />
              <div className="text-sm text-slate-300 font-medium">{uploading ? "Mengunggah..." : "Klik untuk upload foto"}</div>
              <div className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP · Multiple files · Max 10MB per file</div>
            </label>

            {form.images.length > 0 && (
              <div data-testid="uploaded-images" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group">
                    <img src={fileUrl(img.id)} alt={img.original_filename} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      data-testid={`remove-image-${idx}`}
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/90 border border-slate-700 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => nav("/")}
              className="text-slate-300 hover:bg-slate-800 hover:text-white h-11"
            >
              Batal
            </Button>
            <Button
              data-testid="form-submit-btn"
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-11 px-6 gap-2"
            >
              <Save className="w-4 h-4" strokeWidth={2.5} />
              {saving ? "Menyimpan..." : isEdit ? "Perbarui Laporan" : "Simpan Laporan"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function FieldWrap({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-slate-400 font-mono">{label}</Label>
      {children}
    </div>
  );
}
