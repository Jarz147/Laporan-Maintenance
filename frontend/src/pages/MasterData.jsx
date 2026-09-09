import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Factory, Cog, User, Wrench, Database, Download, Upload as UploadIcon, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const TYPES = [
  { key: "line", label: "Line", icon: Factory, color: "text-amber-400", placeholder: "cth: Assy 7" },
  { key: "mesin", label: "Mesin", icon: Cog, color: "text-blue-400", placeholder: "cth: Robot welding" },
  { key: "jig", label: "Jig", icon: Wrench, color: "text-emerald-400", placeholder: "cth: Manifold" },
  { key: "operator", label: "Operator", icon: User, color: "text-indigo-400", placeholder: "cth: Roch" },
];

export default function MasterData() {
  const nav = useNavigate();
  const [items, setItems] = useState({ line: [], mesin: [], jig: [], operator: [] });
  const [newName, setNewName] = useState({ line: "", mesin: "", jig: "", operator: "" });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/master/template", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "master_data_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Template Excel diunduh");
    } catch (e) {
      toast.error("Gagal mengunduh template");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/master/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const total = data.line + data.mesin + data.jig + data.operator;
      toast.success(
        `Import selesai: ${total} data baru (+${data.line} Line, +${data.mesin} Mesin, +${data.jig} Jig, +${data.operator} Operator)${data.skipped ? ` · ${data.skipped} duplikat dilewati` : ""}`
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal import file");
    } finally {
      setImporting(false);
    }
  };

  const load = async () => {
    try {
      const { data } = await api.get("/master");
      const g = { line: [], mesin: [], jig: [], operator: [] };
      for (const it of data) if (g[it.type]) g[it.type].push(it);
      setItems(g);
    } catch (e) {
      toast.error("Gagal memuat master data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async (type) => {
    const name = newName[type].trim();
    if (!name) return;
    try {
      await api.post("/master", { type, name });
      setNewName((p) => ({ ...p, [type]: "" }));
      toast.success(`${name} ditambahkan`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menambah");
    }
  };

  const del = async (id, name) => {
    try {
      await api.delete(`/master/${id}`);
      toast.success(`${name} dihapus`);
      load();
    } catch (e) {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grain-overlay">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Button data-testid="back-btn" variant="ghost" onClick={() => nav("/")}
            className="text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 h-9 px-3">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
          <div className="ml-auto flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            <Database className="w-3.5 h-3.5" /> Master Data
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
            // Data Referensi
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Master Data</h1>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                Kelola daftar <span className="text-white font-medium">Line, Mesin, Jig,</span> dan <span className="text-white font-medium">Operator</span>. Import banyak sekaligus lewat Excel, atau tambah manual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button data-testid="download-template-btn" variant="ghost" onClick={downloadTemplate}
                className="text-slate-200 border border-slate-800 hover:bg-slate-800 hover:text-white gap-1.5 h-10">
                <Download className="w-4 h-4" /> Template Excel
              </Button>
              <label className="inline-flex">
                <input data-testid="import-excel-input" type="file" accept=".xlsx,.xlsm"
                  onChange={handleImport} disabled={importing} className="hidden" />
                <span data-testid="import-excel-btn"
                  className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md font-bold text-slate-950 cursor-pointer transition-colors ${importing ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400"}`}>
                  <UploadIcon className="w-4 h-4" strokeWidth={2.5} />
                  {importing ? "Mengimport..." : "Import Excel"}
                </span>
              </label>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-200 font-medium">Format Template:</span> 1 file .xlsx berisi 4 sheet (<span className="text-amber-400 font-mono">Line, Mesin, Jig, Operator</span>) dengan kolom <span className="font-mono text-slate-200">Name</span> di baris pertama. Isi mulai baris ke-2. Duplikat otomatis dilewati.
            </div>
          </div>
        </div>

        <Tabs defaultValue="line" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 h-auto flex flex-wrap p-1 gap-1 w-full sm:w-auto">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.key} value={t.key} data-testid={`tab-${t.key}`}
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold gap-1.5 px-3 sm:px-4 h-9">
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span className="text-[10px] font-mono opacity-70 ml-0.5">({items[t.key].length})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <TabsContent key={t.key} value={t.key} className="space-y-4">
                <Card className="bg-slate-900/60 border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                    <Icon className={`w-4 h-4 ${t.color}`} />
                    <div className="text-xs font-mono uppercase tracking-widest text-slate-400">Tambah {t.label} Baru</div>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); add(t.key); }} className="flex gap-2">
                    <Input data-testid={`input-${t.key}`}
                      value={newName[t.key]}
                      onChange={(e) => setNewName({ ...newName, [t.key]: e.target.value })}
                      placeholder={t.placeholder}
                      className="bg-slate-950 border-slate-800 text-white h-11 flex-1" />
                    <Button type="submit" data-testid={`add-${t.key}-btn`}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-11 gap-1.5 px-5">
                      <Plus className="w-4 h-4" strokeWidth={2.5} /> Tambah
                    </Button>
                  </form>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
                      Daftar {t.label} <span className="text-slate-400">({items[t.key].length})</span>
                    </div>
                  </div>
                  {loading ? (
                    <div className="text-center py-8 text-slate-600 font-mono text-xs">Memuat...</div>
                  ) : items[t.key].length === 0 ? (
                    <div className="text-center py-10 text-slate-600 text-sm border border-dashed border-slate-800 rounded-md">
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${t.color} opacity-40`} />
                      Belum ada data {t.label.toLowerCase()}. Tambahkan lewat form di atas.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-800" data-testid={`list-${t.key}`}>
                      {items[t.key].map((it) => (
                        <li key={it.id} data-testid={`${t.key}-item-${it.id}`}
                          className="py-2.5 flex items-center gap-3 group">
                          <Icon className={`w-3.5 h-3.5 ${t.color} shrink-0`} />
                          <div className="text-sm text-slate-200 flex-1">{it.name}</div>
                          <Button size="sm" variant="ghost" onClick={() => del(it.id, it.name)}
                            data-testid={`delete-${t.key}-${it.id}`}
                            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
