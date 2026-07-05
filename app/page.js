"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-800 p-10 text-center shadow-2xl">
        <span className="block text-6xl mb-5">🌎</span>
        <h1 className="text-2xl font-bold text-white tracking-tight">EcoGestão Escolar</h1>
        <p className="text-slate-400 text-sm mt-2 mb-10 leading-relaxed">
          Transformando a reciclagem em aprendizado e gamificação para sua escola.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 py-3.5 font-bold text-white hover:brightness-110 transition"
          >
            Entrar como Professor
          </Link>
          <Link
            href="/cadastro"
            className="rounded-xl border-2 border-green-500 py-3.5 font-bold text-green-400 hover:bg-green-500/10 transition"
          >
            Criar Nova Conta
          </Link>
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-widest text-slate-600">
          v2.0 • Gestão Sustentável
        </p>
      </div>
    </div>
  );
}
