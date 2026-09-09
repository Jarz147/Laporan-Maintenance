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
import {
  ArrowLeft, Save, Upload, X, ImagePlus, Wrench, Plus, ListChecks, Zap, UserCog, ClipboardList, AlertTriangle
} from "lucide-react";
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
  const [master, setMaster] = useState({ line: [], mesin: [], jig: [], operator: [] });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/master");
        const g = { line: [], mesin: [], jig: [], operator: [] };
        for (const it of data) if (g[it.type]) g[it.type].push(it.name);
        setMaster(g);
      } catch {}
    })();
  }, []);

  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    shift: user?.shift === "shift2" ? "shift2" : "shift1",
    area: "",
    line: "",
    mesin: "",
    jig: "",
    deskripsi: "",
    problems: [""],
    activities: [""],
    who: user?.name || "",
    time: "",
    status: "progress",
    kendala: "",
    pic: "",
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
          area: data.area || "",
          line: data.line || "",
          mesin: data.mesin || "",
          jig: data.jig || "",
          deskripsi: data.deskripsi || "",
          problems: data.problems?.length ? data.problems : [""],
          activities: data.activities?.length ? data.activities : [""],
          who: data.who || "",
          time: data.time || "",
          status: data.status,
          kendala: data.kendala || "",
          pic: data.pic || "",
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
    const uploaded = [];
    for (const f of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        uploaded.push({ ...data, label: "" });
      } catch (e) {
        toast.error(`Gagal upload ${f.name}: ${formatApiErrorDetail(e.response?.data?.detail) || e.message}`);
      }
    }
    setForm((p) => ({ ...p, images: [...p.images, ...uploaded] }));
    setUploading(false);
    if (uploaded.length) toast.success(`${uploaded.length} foto diunggah`);
  };

  const removeImage = (idx) => setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  const setImageLabel = (idx, label) => setForm((p) => ({
    ...p,
    images: p.images.map((img, i) => (i === idx ? { ...img, label } : img)),
  }));

  const setListItem = (key, idx, val) => setForm((p) => ({
    ...p,
    [key]: p[key].map((it, i) => (i === idx ? val : it)),
  }));
  const addListItem = (key) => setForm((p) => ({ ...p, [key]: [...p[key], ""] }));
  const removeListItem = (key, idx) => setForm((p) => ({
    ...p,
    [key]: p[key].length <= 1 ? [""] : p[key].filter((_, i) => i !== idx),
  }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        problems: form.problems.map((s) => s.trim()).filter(Boolean),
        activities: form.activities.map((s) => s.trim()).filter(Boolean),
      };
      if (isEdit) {
        await api.put(`/reports/${id}`, payload);
        toast.success("Laporan berhasil diperbarui");
      } else {
        await api.post("/reports", payload);
        toast.success("Laporan berhasil disimpan");
      }
      nav("/");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-sm">Memuat...</div>;

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button data-testid="back-btn" variant="ghost" onClick={() => nav("/")}
            className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto text-xs font-mono uppercase tracking-widest text-slate-500">
            {isEdit ? "Edit Laporan" : "Laporan Baru"}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
            // {isEdit ? "Perbarui Laporan Maintenance" : "Format Laporan PPT — Maintenance"}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {isEdit ? "Edit Laporan" : "Laporan Harian Baru"}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Info Dasar */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-5">
            <SectionHeader icon={<Wrench className="w-4 h-4 text-amber-400" />} label="Informasi Dasar" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldWrap label="Tanggal">
                <Input data-testid="form-tanggal" type="date" required value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white h-11" />
              </FieldWrap>
              <FieldWrap label="Shift">
                <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v })}>
                  <SelectTrigger data-testid="form-shift" className="bg-slate-950 border-slate-800 text-white h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="shift1">Shift 1 (Pagi)</SelectItem>
                    <SelectItem value="shift2">Shift 2 (Malam)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="form-status" className="bg-slate-950 border-slate-800 text-white h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {Object.entries(STATUS_MAP).filter(([k]) => k !== "pending").map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
            </div>
            <FieldWrap label="Judul Laporan / Area">
              <Input data-testid="form-area" required value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="cth: Robot Welding Assy 7 — Perbaikan Manifold"
                className="bg-slate-950 border-slate-800 text-white h-11" />
            </FieldWrap>
            <FieldWrap label="PIC (Person In Charge)">
              <Select value={form.pic || undefined} onValueChange={(v) => setForm({ ...form, pic: v })}>
                <SelectTrigger data-testid="form-pic" className="bg-slate-950 border-slate-800 text-white h-11">
                  <SelectValue placeholder={master.operator.length ? "Pilih PIC dari master Operator" : "Belum ada operator — tambah di Master Data"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {master.operator.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldWrap>
          </Card>

          {/* Keterangan */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-5">
            <SectionHeader icon={<ClipboardList className="w-4 h-4 text-emerald-400" />} label="Keterangan" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldWrap label="Line">
                <Select value={form.line || undefined} onValueChange={(v) => setForm({ ...form, line: v })}>
                  <SelectTrigger data-testid="form-line" className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue placeholder={master.line.length ? "Pilih Line" : "Belum ada — tambah di Master Data"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {master.line.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Mesin">
                <Select value={form.mesin || undefined} onValueChange={(v) => setForm({ ...form, mesin: v })}>
                  <SelectTrigger data-testid="form-mesin" className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue placeholder={master.mesin.length ? "Pilih Mesin" : "Belum ada — tambah di Master Data"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {master.mesin.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
              <FieldWrap label="Jig">
                <Select value={form.jig || undefined} onValueChange={(v) => setForm({ ...form, jig: v })}>
                  <SelectTrigger data-testid="form-jig" className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue placeholder={master.jig.length ? "Pilih Jig" : "Belum ada — tambah di Master Data"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {master.jig.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWrap>
            </div>
          </Card>

          {/* Kendala — muncul otomatis saat status = Kendala */}
          {form.status === "issue" && (
            <Card data-testid="kendala-card" className="bg-rose-500/5 border-rose-500/30 p-5 sm:p-6 space-y-4 animate-slide-fade">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <div className="text-xs font-mono uppercase tracking-widest text-rose-400">Deskripsi Kendala</div>
              </div>
              <FieldWrap label="Jelaskan kendala yang terjadi">
                <Textarea data-testid="form-kendala" value={form.kendala}
                  onChange={(e) => setForm({ ...form, kendala: e.target.value })}
                  placeholder="cth: Robot welding tidak bisa start karena error servo. Sudah dicoba restart tapi masih error. Butuh teknisi vendor untuk kalibrasi ulang..."
                  rows={4}
                  className="bg-slate-950 border-rose-500/30 text-white resize-none focus-visible:ring-rose-500 focus-visible:ring-offset-0" />
              </FieldWrap>
            </Card>
          )}

          {/* WHAT (Problem) */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-3">
            <SectionHeader icon={<ListChecks className="w-4 h-4 text-rose-400" />} label="WHAT (Problem)" />
            {form.problems.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="w-9 h-11 flex items-center justify-center rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-bold shrink-0">
                  {toRoman(idx + 1)}
                </div>
                <Textarea data-testid={`form-problem-${idx}`} value={p}
                  onChange={(e) => setListItem("problems", idx, e.target.value)}
                  placeholder="cth: Pemasangan ketok pada jig 3,2 tak welding"
                  rows={2}
                  className="bg-slate-950 border-slate-800 text-white resize-none flex-1" />
                <Button type="button" variant="ghost" size="sm"
                  data-testid={`remove-problem-${idx}`}
                  onClick={() => removeListItem("problems", idx)}
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-11 w-9 p-0 shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" data-testid="add-problem-btn"
              onClick={() => addListItem("problems")}
              className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1.5 h-9">
              <Plus className="w-4 h-4" /> Tambah Problem
            </Button>
          </Card>

          {/* HOW (Activity) */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-3">
            <SectionHeader icon={<Zap className="w-4 h-4 text-blue-400" />} label="HOW (Activity)" />
            {form.activities.map((a, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="w-9 h-11 flex items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-lg shrink-0">
                  •
                </div>
                <Textarea data-testid={`form-activity-${idx}`} value={a}
                  onChange={(e) => setListItem("activities", idx, e.target.value)}
                  placeholder="cth: Cek an analisa pada jig welding 3,2 dan cara pemasangannya"
                  rows={2}
                  className="bg-slate-950 border-slate-800 text-white resize-none flex-1" />
                <Button type="button" variant="ghost" size="sm"
                  data-testid={`remove-activity-${idx}`}
                  onClick={() => removeListItem("activities", idx)}
                  className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-11 w-9 p-0 shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" data-testid="add-activity-btn"
              onClick={() => addListItem("activities")}
              className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 gap-1.5 h-9">
              <Plus className="w-4 h-4" /> Tambah Activity
            </Button>
          </Card>

          {/* Dikerjakan */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-5">
            <SectionHeader icon={<UserCog className="w-4 h-4 text-amber-400" />} label="Dikerjakan" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrap label="Who">
                <Input data-testid="form-who" value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })}
                  list="master-operators" placeholder="cth: Roch" className="bg-slate-950 border-slate-800 text-white h-11" />
              </FieldWrap>
              <FieldWrap label="Time">
                <Input data-testid="form-time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="cth: 08:30 - 10:00" className="bg-slate-950 border-slate-800 text-white h-11" />
              </FieldWrap>
            </div>
            <FieldWrap label="Catatan / Rekomendasi (Opsional)">
              <Textarea data-testid="form-catatan" value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="Catatan tambahan, rekomendasi untuk shift berikutnya, spare part..."
                rows={3}
                className="bg-slate-950 border-slate-800 text-white resize-none" />
            </FieldWrap>
          </Card>

          {/* Foto */}
          <Card className="bg-slate-900/60 border-slate-800 p-5 sm:p-6 space-y-4">
            <SectionHeader icon={<ImagePlus className="w-4 h-4 text-amber-400" />} label="Foto Dokumentasi Activity" />
            <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-lg py-8 cursor-pointer hover:border-amber-500/60 hover:bg-slate-900 transition-all">
              <input data-testid="form-file-input" type="file" multiple accept="image/*"
                onChange={(e) => handleFiles(e.target.files)} className="hidden" disabled={uploading} />
              <Upload className={`w-8 h-8 mb-2 ${uploading ? "text-slate-600 animate-pulse" : "text-slate-500"}`} />
              <div className="text-sm text-slate-300 font-medium">{uploading ? "Mengunggah..." : "Klik untuk upload foto"}</div>
              <div className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP · Multiple · Max 10MB · Tambahkan label Before/After per foto</div>
            </label>
            {form.images.length > 0 && (
              <div data-testid="uploaded-images" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((img, idx) => (
                  <div key={img.id} className="space-y-2">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group">
                      <img src={fileUrl(img.id)} alt={img.original_filename} className="w-full h-full object-cover" />
                      <button type="button" data-testid={`remove-image-${idx}`}
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/90 border border-slate-700 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" data-testid={`label-before-${idx}`}
                        onClick={() => setImageLabel(idx, "Before")}
                        className={`flex-1 h-7 text-[10px] font-bold rounded transition-colors ${(img.label || "").toLowerCase() === "before" ? "bg-slate-500/30 text-slate-100 border border-slate-400" : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-200 hover:border-slate-600"}`}>
                        Before
                      </button>
                      <button type="button" data-testid={`label-after-${idx}`}
                        onClick={() => setImageLabel(idx, "After")}
                        className={`flex-1 h-7 text-[10px] font-bold rounded transition-colors ${(img.label || "").toLowerCase() === "after" ? "bg-emerald-500/30 text-emerald-100 border border-emerald-400" : "bg-slate-900 text-slate-500 border border-slate-800 hover:text-emerald-300 hover:border-emerald-700"}`}>
                        After
                      </button>
                    </div>
                    <Input data-testid={`image-label-${idx}`} value={img.label || ""}
                      onChange={(e) => setImageLabel(idx, e.target.value)}
                      placeholder="Label kustom..."
                      className="bg-slate-950 border-slate-800 text-white h-9 text-xs text-center" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => nav("/")}
              className="text-slate-300 hover:bg-slate-800 hover:text-white h-11">Batal</Button>
            <Button data-testid="form-submit-btn" type="submit" disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-11 px-6 gap-2">
              <Save className="w-4 h-4" strokeWidth={2.5} />
              {saving ? "Menyimpan..." : isEdit ? "Perbarui Laporan" : "Simpan Laporan"}
            </Button>
          </div>
        </form>

        {/* Master operator autocomplete for Who field */}
        <datalist id="master-operators">
          {master.operator.map((n) => <option key={n} value={n} />)}
        </datalist>
      </main>
    </div>
  );
}

function SectionHeader({ icon, label }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
      {icon}
      <div className="text-xs font-mono uppercase tracking-widest text-slate-400">{label}</div>
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

function toRoman(num) {
  const map = [["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]];
  let n = num, out = "";
  for (const [r, v] of map) {
    while (n >= v) { out += r; n -= v; }
  }
  return out || String(num);
}
