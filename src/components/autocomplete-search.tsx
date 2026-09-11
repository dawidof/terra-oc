"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Car, Search, X } from "lucide-react";

interface SearchResult {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  basePrice: string | null;
  powertrainType: string | null;
  imageUrl: string | null;
}

interface AutocompleteSearchProps {
  placeholder?: string;
  className?: string;
  onSelect?: (slug: string) => void;
}

function formatPrice(price: string | null): string {
  if (!price) return "";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return "";
  }
}

function ResultItem({ r, onClick }: { r: SearchResult; onClick: () => void }) {
  return (
    <Link
      href={`/cars/${r.trimSlug}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 border-b border-border/50 last:border-b-0"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {r.imageUrl ? (
          <img
            src={r.imageUrl}
            alt={`${r.brandName} ${r.modelName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Car className="size-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {r.brandName} {r.modelName}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {r.trimName}
          {r.powertrainType && (
            <span className="ml-1.5 text-muted-foreground/70">
              · {powertrainLabel(r.powertrainType)}
            </span>
          )}
        </div>
      </div>
      {r.basePrice && (
        <div className="shrink-0 text-right text-sm font-semibold text-emerald-600">
          {formatPrice(r.basePrice)}
        </div>
      )}
    </Link>
  );
}

export function AutocompleteSearch({
  placeholder = "Поиск автомобиля...",
  className = "",
  onSelect,
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popular, setPopular] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadPopular = useCallback(async () => {
    if (popular.length > 0) return;
    try {
      const res = await fetch("/api/search-trims?popular=true");
      const data = await res.json();
      setPopular(data.trims || []);
    } catch {
      // silent
    }
  }, [popular.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
      }, 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search-trims?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.trims || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleFocus() {
    loadPopular();
    setOpen(true);
  }

  function handleSelect(slug: string) {
    if (onSelect) {
      onSelect(slug);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const showPopular = open && query.length < 2 && popular.length > 0;
  const showResults = open && query.length >= 2 && results.length > 0;
  const showEmpty = open && query.length >= 2 && results.length === 0 && !loading;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="h-9 pl-9 pr-8 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {(showPopular || showResults || showEmpty) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {showPopular && (
            <>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Популярные модели
              </div>
              {popular.map((r) => (
                <ResultItem key={r.trimId} r={r} onClick={() => handleSelect(r.trimSlug)} />
              ))}
            </>
          )}

          {showResults && (
            <>
              {query.length >= 2 && (
                <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Результаты
                </div>
              )}
              {results.map((r) => (
                <ResultItem key={r.trimId} r={r} onClick={() => handleSelect(r.trimSlug)} />
              ))}
            </>
          )}

          {showEmpty && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
}
