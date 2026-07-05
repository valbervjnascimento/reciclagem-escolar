"use client";

import { useEffect } from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-800/60 border border-slate-700 rounded-2xl p-4 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-4 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-gradient-to-br from-green-500 to-green-600 text-white hover:brightness-110 shadow-lg shadow-green-900/30",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
    danger: "bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
    outline: "bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className="block text-left">
      {label && (
        <span className="block text-xs font-medium text-slate-300 mb-1.5 ml-0.5">{label}</span>
      )}
      <input
        className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-green-500 transition ${className}`}
        {...props}
      />
      {hint && <span className="block text-[11px] text-slate-500 mt-1 ml-0.5">{hint}</span>}
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block text-left">
      {label && (
        <span className="block text-xs font-medium text-slate-300 mb-1.5 ml-0.5">{label}</span>
      )}
      <select
        className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-green-500 transition ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-700 text-slate-200",
    green: "bg-green-500/15 text-green-400 border border-green-500/30",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    red: "bg-red-500/15 text-red-400 border border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>}
        <div className="text-sm text-slate-300">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {subtitle && <p className="text-xs mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
