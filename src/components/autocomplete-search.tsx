"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

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

export function AutocompleteSearch({
  placeholder = "Поиск автомобиля...",
  className = "",
  onSelect,
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
      // Clear results after a short delay to avoid synchronous setState in effect
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setOpen(false);
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

  function handleSelect(slug: string) {
    if (onSelect) {
      onSelect(slug);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {results.map((r) => (
            <Link
              key={r.trimId}
              href={`/cars/${r.trimSlug}`}
              onClick={() => handleSelect(r.trimSlug)}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium">
                  {r.brandName} {r.modelName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.trimName}
                  {r.powertrainType && (
                    <span className="ml-2">
                      {powertrainLabel(r.powertrainType)}
                    </span>
                  )}
                </div>
              </div>
              {r.basePrice && (
                <div className="text-sm font-medium text-emerald-600">
                  {formatPrice(r.basePrice)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-white p-4 text-center text-sm text-muted-foreground shadow-lg">
          Ничего не найдено
        </div>
      )}
    </div>
  );
}
