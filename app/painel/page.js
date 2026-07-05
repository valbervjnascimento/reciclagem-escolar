"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button, Card, Input, Select, Badge, Modal, EmptyState } from "../components/ui";
import { detectarDuplicidade } from "../../lib/duplicidade";

const MATERIAIS = [
  { chave: "plastico", rotulo: "Plástico", emoji: "🧴", cor: "#3b82f6" },
  { chave: "aluminio", rotulo: "Alumínio", emoji: "🥫", cor: "#f59e0b" },
  { chave: "frasco", rotulo: "Frasco de perfume", emoji: "🌸", cor: "#10b981" },
];

export default function Painel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [turma, setTurma] = useState(null);
  const [nomeTurma, setNomeTurma] = useState("");
  const [carregandoTurma, setCarregandoTurma] = useState(true);

  const [alunos, setAlunos] = useState([]);
  const [novoAluno, setNovoAluno] = useState("");
  const [editandoAlunoId, setEditandoAlunoId] = useState(null);

  const [registros, setRegistros] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroDuplicidade, setFiltroDuplicidade] = useState("todos"); // todos | suspeitos

  // Formulário de coleta
  const [alunoId, setAlunoId] = useState("");
  const [valores, setValores] = useState({ plastico: "", aluminio: "", frasco: "" });
  const [editandoId, setEditandoId] = useState(null);

  // Confirmação de possível duplicidade
  const [confirmacaoDuplicidade, setConfirmacaoDuplicidade] = useState(null);
  // Confirmação de exclusão
  const [exclusaoPendente, setExclusaoPendente] = useState(null); // { tipo, id, label }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) carregarTurma();
  }, [user]);

  const carregarTurma = async () => {
    setCarregandoTurma(true);
    try {
      const q = query(collection(db, "turmas"), where("professorId", "==", user.uid));
      const dados = await getDocs(q);
      if (!dados.empty) {
        const turmaData = { id: dados.docs[0].id, ...dados.docs[0].data() };
        setTurma(turmaData);
        await Promise.all([carregarAlunos(turmaData.id), carregarRegistros(turmaData.id)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoTurma(false);
    }
  };

  const carregarAlunos = async (id) => {
    const q = query(collection(db, "alunos"), where("turmaId", "==", id));
    const d = await getDocs(q);
    setAlunos(d.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const carregarRegistros = async (id) => {
    const q = query(collection(db, "registros"), where("turmaId", "==", id));
    const d = await getDocs(q);
    setRegistros(d.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const criarTurma = async () => {
    if (!nomeTurma.trim()) return;
    const dr = await addDoc(collection(db, "turmas"), {
      nome: nomeTurma.trim(),
      professorId: user.uid,
      createdAt: Date.now(),
    });
    setTurma({ id: dr.id, nome: nomeTurma.trim(), professorId: user.uid });
    setNomeTurma("");
  };

  // ---------- CRUD Alunos ----------
  const salvarAluno = async () => {
    if (!novoAluno.trim()) return;
    try {
      if (editandoAlunoId) {
        await updateDoc(doc(db, "alunos", editandoAlunoId), { nome: novoAluno.trim() });
        setEditandoAlunoId(null);
      } else {
        await addDoc(collection(db, "alunos"), {
          nome: novoAluno.trim(),
          turmaId: turma.id,
          createdAt: Date.now(),
        });
      }
      setNovoAluno("");
      await carregarAlunos(turma.id);
    } catch {
      alert("Erro ao salvar aluno.");
    }
  };

  const confirmarExclusaoAluno = (aluno) =>
    setExclusaoPendente({ tipo: "aluno", id: aluno.id, label: aluno.nome });

  // ---------- CRUD Registros (coletas) ----------
  const limparFormularioColeta = () => {
    setEditandoId(null);
    setAlunoId("");
    setValores({ plastico: "", aluminio: "", frasco: "" });
  };

  const iniciarEdicaoRegistro = (reg) => {
    setEditandoId(reg.id);
    setAlunoId(reg.alunoId);
    setValores({
      plastico: String(reg.plastico ?? ""),
      aluminio: String(reg.aluminio ?? ""),
      frasco: String(reg.frasco ?? ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const montarDadosRegistro = () => ({
    alunoId,
    turmaId: turma.id,
    professorId: user.uid,
    data: editandoId ? registros.find((r) => r.id === editandoId)?.data ?? Date.now() : Date.now(),
    plastico: Number(valores.plastico) || 0,
    aluminio: Number(valores.aluminio) || 0,
    frasco: Number(valores.frasco) || 0,
  });

  const tentarSalvarColeta = () => {
    if (!alunoId) return alert("Selecione um aluno.");
    const dados = montarDadosRegistro();
    const duplicidade = detectarDuplicidade(dados, registros, editandoId);

    if (duplicidade) {
      setConfirmacaoDuplicidade({ dados, duplicidade });
      return;
    }
    salvarColeta(dados, null);
  };

  const salvarColeta = async (dados, duplicidade) => {
    const payload = {
      ...dados,
      suspeitaDuplicidade: duplicidade
        ? { ...duplicidade, detectadaEm: Date.now(), revisado: false }
        : null,
    };
    try {
      if (editandoId) {
        await updateDoc(doc(db, "registros", editandoId), payload);
      } else {
        await addDoc(collection(db, "registros"), payload);
      }
      limparFormularioColeta();
      setConfirmacaoDuplicidade(null);
      await carregarRegistros(turma.id);
    } catch {
      alert("Erro ao salvar a coleta.");
    }
  };

  const marcarComoRevisado = async (reg) => {
    try {
      await updateDoc(doc(db, "registros", reg.id), {
        suspeitaDuplicidade: { ...reg.suspeitaDuplicidade, revisado: true },
      });
      await carregarRegistros(turma.id);
    } catch {
      alert("Erro ao atualizar o registro.");
    }
  };

  const confirmarExclusaoRegistro = (reg) => {
    const nomeAluno = alunos.find((a) => a.id === reg.alunoId)?.nome || "aluno removido";
    setExclusaoPendente({
      tipo: "registro",
      id: reg.id,
      label: `coleta de ${nomeAluno} em ${new Date(reg.data).toLocaleDateString("pt-BR")}`,
    });
  };

  const executarExclusao = async () => {
    if (!exclusaoPendente) return;
    const { tipo, id } = exclusaoPendente;
    try {
      if (tipo === "aluno") {
        await deleteDoc(doc(db, "alunos", id));
        await carregarAlunos(turma.id);
      } else if (tipo === "registro") {
        await deleteDoc(doc(db, "registros", id));
        if (editandoId === id) limparFormularioColeta();
        await carregarRegistros(turma.id);
      }
    } catch {
      alert("Erro ao excluir.");
    } finally {
      setExclusaoPendente(null);
    }
  };

  // ---------- Derivados ----------
  const stats = useMemo(() => {
    const totais = MATERIAIS.reduce((acc, m) => {
      acc[m.chave] = registros.reduce((s, r) => s + (Number(r[m.chave]) || 0), 0);
      return acc;
    }, {});
    const total = MATERIAIS.reduce((s, m) => s + totais[m.chave], 0);
    return { ...totais, total };
  }, [registros]);

  const ranking = useMemo(() => {
    return alunos
      .map((aluno) => {
        const total = registros
          .filter((r) => r.alunoId === aluno.id)
          .reduce(
            (s, r) => s + (Number(r.plastico) || 0) + (Number(r.aluminio) || 0) + (Number(r.frasco) || 0),
            0
          );
        return { nome: aluno.nome, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [alunos, registros]);

  const registrosFiltrados = useMemo(() => {
    return registros
      .filter((reg) => {
        const nome = alunos.find((a) => a.id === reg.alunoId)?.nome || "Removido";
        const combinaBusca = nome.toLowerCase().includes(busca.toLowerCase());
        const combinaFiltro =
          filtroDuplicidade === "todos" ||
          (reg.suspeitaDuplicidade && !reg.suspeitaDuplicidade.revisado);
        return combinaBusca && combinaFiltro;
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [registros, alunos, busca, filtroDuplicidade]);

  const totalSuspeitos = useMemo(
    () => registros.filter((r) => r.suspeitaDuplicidade && !r.suspeitaDuplicidade.revisado).length,
    [registros]
  );

  if (loading || carregandoTurma) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-green-400">
        Carregando EcoGestão...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 sm:px-6 py-3">
        <h1 className="text-base sm:text-lg font-bold text-green-400 flex items-center gap-2">
          🌎 <span className="hidden sm:inline">EcoGestão Escolar</span>
          <span className="sm:hidden">EcoGestão</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-slate-400">👨‍🏫 {user?.email}</span>
          <Button variant="danger" onClick={() => signOut(auth)} className="!px-3 !py-1.5 text-xs">
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!turma ? (
          <Card className="max-w-md mx-auto mt-16 text-center">
            <h2 className="text-lg font-bold mb-4">Criar minha turma</h2>
            <div className="space-y-3">
              <Input
                placeholder="Ex: 7º Ano A"
                value={nomeTurma}
                onChange={(e) => setNomeTurma(e.target.value)}
              />
              <Button className="w-full" onClick={criarTurma}>
                Criar Turma
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-slate-300 text-sm sm:text-base">🏫 {turma.nome}</h2>
              {totalSuspeitos > 0 && (
                <button
                  onClick={() =>
                    setFiltroDuplicidade(filtroDuplicidade === "todos" ? "suspeitos" : "todos")
                  }
                >
                  <Badge tone="amber">
                    ⚠️ {totalSuspeitos} possível{totalSuspeitos > 1 ? "eis" : ""} duplicidade
                    {totalSuspeitos > 1 ? "s" : ""} —{" "}
                    {filtroDuplicidade === "todos" ? "ver" : "ver todos"}
                  </Badge>
                </button>
              )}
            </div>

            {/* Cards de estatística */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs opacity-90">Total Geral</div>
              </div>
              {MATERIAIS.map((m) => (
                <div
                  key={m.chave}
                  className="rounded-xl bg-slate-800 border-l-4 p-4 text-center"
                  style={{ borderColor: m.cor }}
                >
                  <div className="text-xl font-bold">{stats[m.chave]}</div>
                  <div className="text-xs text-slate-400">
                    {m.emoji} {m.rotulo}
                  </div>
                </div>
              ))}
            </section>

            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <h3 className="font-semibold mb-3">📊 Materiais</h3>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={MATERIAIS.map((m) => ({ n: m.rotulo, v: stats[m.chave] }))}>
                      <XAxis dataKey="n" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" width={28} fontSize={12} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "none" }} />
                      <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                        {MATERIAIS.map((m, i) => (
                          <Cell key={i} fill={m.cor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold mb-3">🏆 Ranking</h3>
                {ranking.length === 0 ? (
                  <EmptyState icon="🏆" title="Cadastre alunos para ver o ranking" />
                ) : (
                  <div className="space-y-2">
                    {ranking.slice(0, 5).map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-slate-700 pb-2 text-sm last:border-0 last:pb-0"
                      >
                        <span className="text-slate-300">
                          {i + 1}º {r.nome.split(" ")[0]}
                        </span>
                        <strong className="text-green-400">{r.total}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Lançamento de coleta */}
            <Card>
              <h3 className="font-semibold mb-4">
                {editandoId ? "📝 Editar Coleta" : "♻️ Nova Coleta"}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="lg:col-span-2">
                  <Select
                    label="Aluno"
                    value={alunoId}
                    onChange={(e) => setAlunoId(e.target.value)}
                  >
                    <option value="">Selecionar aluno</option>
                    {[...alunos]
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                  </Select>
                </div>
                {MATERIAIS.map((m) => (
                  <Input
                    key={m.chave}
                    label={`${m.emoji} ${m.rotulo}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={valores[m.chave]}
                    onChange={(e) => setValores((v) => ({ ...v, [m.chave]: e.target.value }))}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={tentarSalvarColeta}>{editandoId ? "Atualizar" : "Lançar"}</Button>
                {editandoId && (
                  <Button variant="secondary" onClick={limparFormularioColeta}>
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>

            {/* Histórico */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-semibold">📑 Histórico de coletas</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="🔍 Buscar aluno..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="sm:w-56"
                  />
                  <Select
                    value={filtroDuplicidade}
                    onChange={(e) => setFiltroDuplicidade(e.target.value)}
                    className="sm:w-44"
                  >
                    <option value="todos">Todos registros</option>
                    <option value="suspeitos">Só suspeitos</option>
                  </Select>
                </div>
              </div>

              {registrosFiltrados.length === 0 ? (
                <EmptyState
                  icon="♻️"
                  title="Nenhum registro encontrado"
                  subtitle="Ajuste os filtros ou lance a primeira coleta acima."
                />
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                        <th className="py-2 px-4 sm:px-2">Data</th>
                        <th className="py-2 px-2">Aluno</th>
                        <th className="py-2 px-2">🧴</th>
                        <th className="py-2 px-2">🥫</th>
                        <th className="py-2 px-2">🌸</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrosFiltrados.map((reg) => {
                        const nomeAluno = alunos.find((a) => a.id === reg.alunoId)?.nome || "Removido";
                        const suspeita = reg.suspeitaDuplicidade;
                        return (
                          <tr key={reg.id} className="border-b border-slate-800 last:border-0">
                            <td className="py-2.5 px-4 sm:px-2 text-slate-400 whitespace-nowrap">
                              {new Date(reg.data).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-2">{nomeAluno.split(" ")[0]}</td>
                            <td className="py-2.5 px-2">{reg.plastico}</td>
                            <td className="py-2.5 px-2">{reg.aluminio}</td>
                            <td className="py-2.5 px-2">{reg.frasco}</td>
                            <td className="py-2.5 px-2">
                              {suspeita && !suspeita.revisado ? (
                                <button onClick={() => marcarComoRevisado(reg)} title="Marcar como revisado">
                                  <Badge tone={suspeita.nivel === "forte" ? "red" : "amber"}>
                                    ⚠️ {suspeita.nivel === "forte" ? "Duplicidade" : "Verificar"}
                                  </Badge>
                                </button>
                              ) : suspeita?.revisado ? (
                                <Badge tone="slate">Revisado</Badge>
                              ) : (
                                <Badge tone="green">OK</Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <button
                                className="mr-3"
                                onClick={() => iniciarEdicaoRegistro(reg)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button onClick={() => confirmarExclusaoRegistro(reg)} title="Excluir">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Gestão de alunos */}
            <Card>
              <h3 className="font-semibold mb-4">👨‍🎓 Gestão de Alunos</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Nome do aluno"
                  value={novoAluno}
                  onChange={(e) => setNovoAluno(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={salvarAluno} className="!px-5">
                  {editandoAlunoId ? "Salvar" : "Adicionar"}
                </Button>
                {editandoAlunoId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditandoAlunoId(null);
                      setNovoAluno("");
                    }}
                  >
                    X
                  </Button>
                )}
              </div>

              {alunos.length === 0 ? (
                <EmptyState icon="👨‍🎓" title="Nenhum aluno cadastrado ainda" />
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {[...alunos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between border-b border-slate-800 py-2 text-sm last:border-0"
                      >
                        <span>{a.nome}</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditandoAlunoId(a.id);
                              setNovoAluno(a.nome);
                            }}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button onClick={() => confirmarExclusaoAluno(a)} title="Excluir">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </>
        )}
      </main>

      {/* Modal: possível duplicidade */}
      <Modal
        open={!!confirmacaoDuplicidade}
        onClose={() => setConfirmacaoDuplicidade(null)}
        title="⚠️ Possível registro duplicado"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmacaoDuplicidade(null)}>
              Revisar antes
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                salvarColeta(confirmacaoDuplicidade.dados, confirmacaoDuplicidade.duplicidade)
              }
            >
              Salvar mesmo assim
            </Button>
          </>
        }
      >
        {confirmacaoDuplicidade && (
          <p>
            Encontramos {confirmacaoDuplicidade.duplicidade.ocorrencias} outro(s) registro(s) para{" "}
            <strong className="text-white">
              {alunos.find((a) => a.id === alunoId)?.nome || "este aluno"}
            </strong>{" "}
            no mesmo dia
            {confirmacaoDuplicidade.duplicidade.nivel === "forte"
              ? " com exatamente os mesmos valores"
              : ", com valores diferentes"}
            . O registro não será apagado — ele apenas ficará marcado como suspeito no histórico
            para você (ou o administrador) revisar depois.
          </p>
        )}
      </Modal>

      {/* Modal: confirmação de exclusão */}
      <Modal
        open={!!exclusaoPendente}
        onClose={() => setExclusaoPendente(null)}
        title="Confirmar exclusão"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExclusaoPendente(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={executarExclusao}>
              Excluir
            </Button>
          </>
        }
      >
        {exclusaoPendente && (
          <p>
            Tem certeza que deseja excluir <strong className="text-white">{exclusaoPendente.label}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        )}
      </Modal>
    </div>
  );
}
