import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string; description?: string; keywords?: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyText?: string;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih data",
  searchPlaceholder = "Cari...",
  disabled = false,
  emptyText = "Data tidak ditemukan",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options.slice(0, 80);
    return options
      .filter((option) => `${option.label} ${option.description ?? ""} ${option.keywords ?? ""}`.toLowerCase().includes(keyword))
      .slice(0, 80);
  }, [options, query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className={selected ? "min-w-0 flex-1 truncate font-semibold text-slate-900" : "min-w-0 flex-1 truncate text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={17} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[90] mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mt-2 max-h-64 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs font-semibold text-slate-400">{emptyText}</div>
            ) : filtered.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => choose(option.value)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{option.label}</span>
                  {option.description && <span className="mt-0.5 block truncate text-xs text-slate-400">{option.description}</span>}
                </span>
                {option.value === value && <Check size={16} className="shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {filtered.length} hasil ditampilkan
          </div>
        </div>
      )}
    </div>
  );
}
