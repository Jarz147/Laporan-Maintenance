import { useState, useCallback, useEffect } from "react";
import { fileUrl } from "../lib/api";
import { ArrowRight, ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";

function pairImages(images) {
  const groups = [];
  let i = 0;
  while (i < images.length) {
    const curr = images[i];
    const next = images[i + 1];
    const cl = (curr.label || "").toLowerCase().trim();
    const nl = (next?.label || "").toLowerCase().trim();
    if (cl === "before" && nl === "after") {
      groups.push({ type: "pair", items: [curr, next], startIdx: i });
      i += 2;
    } else {
      groups.push({ type: "single", items: [curr], startIdx: i });
      i += 1;
    }
  }
  return groups;
}

export function ActivityGallery({ images = [], testidPrefix = "activity-img" }) {
  const [lb, setLb] = useState(null);

  const close = useCallback(() => setLb(null), []);
  const prev = useCallback(() => setLb((i) => (i === null ? null : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setLb((i) => (i === null ? null : (i + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (lb === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, close, next, prev]);

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-600 industrial-stripes rounded-md">
        <ImageIcon className="w-8 h-8 mb-2" />
        <div className="text-xs font-mono uppercase tracking-widest">Tidak ada foto activity</div>
      </div>
    );
  }

  const groups = pairImages(images);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {groups.map((g, gi) => {
          if (g.type === "pair") {
            return (
              <div key={gi} data-testid={`${testidPrefix}-pair-${gi}`}
                className="flex-1 min-w-[280px] max-w-full grid grid-cols-2 gap-0 p-2 rounded-lg bg-slate-950/60 border border-amber-500/30 relative">
                {g.items.map((im, i) => (
                  <button key={im.id} type="button"
                    data-testid={`${testidPrefix}-${g.startIdx + i}`}
                    onClick={() => setLb(g.startIdx + i)}
                    className={`space-y-1 group ${i === 0 ? "pr-1" : "pl-1"}`}>
                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-slate-950 border border-slate-700 group-hover:border-amber-500/60 transition-all">
                      <img src={fileUrl(im.id)} alt={im.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className={`text-center text-xs font-bold italic ${i === 0 ? "text-slate-300" : "text-emerald-400"}`}>
                      {im.label}
                    </div>
                  </button>
                ))}
                <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg ring-4 ring-slate-950">
                    <ArrowRight className="w-4 h-4" strokeWidth={3} />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <button key={gi} type="button"
              data-testid={`${testidPrefix}-${g.startIdx}`}
              onClick={() => setLb(g.startIdx)}
              className="min-w-[160px] flex-1 space-y-1 group max-w-[220px]">
              <div className="aspect-[4/3] rounded-md overflow-hidden bg-slate-950 border border-slate-700 group-hover:border-amber-500/60 transition-all">
                <img src={fileUrl(g.items[0].id)} alt={g.items[0].label || g.items[0].original_filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              {g.items[0].label && (
                <div className="text-center text-xs text-slate-300 font-medium italic">{g.items[0].label}</div>
              )}
            </button>
          );
        })}
      </div>

      {lb !== null && images[lb] && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          onClick={close}>
          <button onClick={(e) => { e.stopPropagation(); close(); }} data-testid="lightbox-close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-rose-500 hover:border-rose-500 flex items-center justify-center transition-all z-10">
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} data-testid="lightbox-prev"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 flex items-center justify-center transition-all z-10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} data-testid="lightbox-next"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 text-white hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 flex items-center justify-center transition-all z-10">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="flex flex-col items-center gap-4 max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={fileUrl(images[lb].id)} alt={images[lb].label || images[lb].original_filename}
              className="max-w-[92vw] max-h-[78vh] object-contain rounded-lg shadow-2xl" />
            <div className="flex items-center gap-4 text-slate-200">
              {images[lb].label && <span className="font-medium italic text-lg">{images[lb].label}</span>}
              <span className="text-xs font-mono text-slate-500 px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700">
                {lb + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
