"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WorkItem } from "@/lib/types";

type Props = {
  items: WorkItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
};

type Position = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function WorkItemCombobox({ items, value, onChange, disabled = false, placeholder = "Buscar trabajo...", compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((item) => item.id === value) ?? null;
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const source = q
      ? items.filter((item) => normalize(`${item.code} ${item.client_name} ${item.title}`).includes(q))
      : items;
    return source.slice(0, 30);
  }, [items, query]);

  useEffect(() => setMounted(true), []);

  function updatePosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const margin = 12;
    const gap = 6;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const desiredWidth = Math.min(430, viewportWidth - margin * 2);
    const left = Math.min(Math.max(margin, rect.left), viewportWidth - desiredWidth - margin);
    const spaceBelow = viewportHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const placement = spaceBelow >= 250 || spaceBelow >= spaceAbove ? "bottom" : "top";
    const available = placement === "bottom" ? spaceBelow : spaceAbove;
    const maxHeight = Math.max(180, Math.min(420, available));
    const top = placement === "bottom"
      ? rect.bottom + gap
      : Math.max(margin, rect.top - gap - maxHeight);

    setPosition({ top, left, width: desiredWidth, maxHeight, placement });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    requestAnimationFrame(() => inputRef.current?.focus());

    const handleViewportChange = () => updatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const panel = open && mounted && position ? createPortal(
    <div
      ref={panelRef}
      className="fixed z-[220] flex overflow-hidden rounded-xl border border-[var(--tbx-border)] bg-[var(--tbx-surface)] shadow-2xl"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        flexDirection: "column",
      }}
    >
      <div className="shrink-0 border-b border-[var(--tbx-border)] p-2">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-3 text-[var(--tbx-text-subtle)]" />
          <input
            ref={inputRef}
            className="tbx-input pl-9 pr-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Enter" && filtered.length === 1) {
                event.preventDefault();
                onChange(filtered[0].id);
                setOpen(false);
                setQuery("");
              }
            }}
          />
          {query ? <button type="button" className="absolute right-2 top-2.5 p-1 text-[var(--tbx-text-subtle)]" onClick={() => setQuery("")}><X size={15} /></button> : null}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--tbx-surface-2)]" onClick={() => { onChange(null); setOpen(false); setQuery(""); }}>
          <span className="grid h-5 w-5 place-items-center">{!value ? <Check size={15} /> : null}</span>
          <span><strong className="block text-sm text-[var(--tbx-text)]">Sin asociar</strong><span className="text-xs">Mantener como tarea independiente</span></span>
        </button>

        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--tbx-surface-2)]"
            onClick={() => { onChange(item.id); setOpen(false); setQuery(""); }}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">{value === item.id ? <Check size={15} /> : null}</span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-[var(--tbx-text)]">{item.title}</strong>
              <span className="block truncate text-xs">{item.client_name} · {item.code}</span>
            </span>
          </button>
        ))}

        {!filtered.length ? <p className="px-3 py-8 text-center text-sm">No encontré trabajos para “{query}”.</p> : null}
      </div>
      {items.length > 30 && !query ? <p className="shrink-0 border-t border-[var(--tbx-border)] px-3 py-2 text-xs">Mostrando 30 resultados. Escribe para buscar entre {items.length} trabajos.</p> : null}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        className={`tbx-input flex items-center justify-between gap-2 text-left ${compact ? "min-w-64" : ""}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-[var(--tbx-text)]">
          {selected ? `${selected.client_name} · ${selected.title}` : "Sin asociar"}
        </span>
        <ChevronDown size={16} className="shrink-0 text-[var(--tbx-text-subtle)]" />
      </button>
      {panel}
    </div>
  );
}
