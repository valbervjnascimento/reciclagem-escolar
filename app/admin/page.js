"use client";

import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { db } from "../../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button, Card, Input, Select, Badge, Modal, EmptyState } from "../components/ui";

const ADMIN_EMAILS = ["valbervjnascimento@gmail.com"];

export default function AdminProfissional() {
  const { user, loading } = useAuth();

  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [registros, setRegistros] = useState([]);

  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("dashboard");

  // Ações administrativas (senha / e-mail)
  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [processando, setProcessando] = useState(false);
  const [resultadoSenha, setResultadoSenha] = useState(null); // { professor, senha }
  const [erroAcao, setErroAcao] = useState("");
  const [exclusaoPendente, setExclusaoPendente] = useState(null);

  const ehAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (ehAdmin) carregarDadosIniciais();
  }, [ehAdmin]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    try {
      const [pSnap, tSnap, aSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "professores")),
        getDocs(collection(db, "turmas")),
        getDocs(collection(db, "alunos")),
        getDocs(collection(db, "registros")),
      ]);
      setProfessores(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTurmas(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setAlunos(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRegistros(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  };

  const registrosFiltrados =
    filtroTurma === "todas" ? registros : registros.filter((r) => r.turmaId === filtroTurma);

  const totalP = registrosFiltrados.reduce((s, r) => s + (Number(r.plastico) || 0), 0);
  const totalA = registrosFiltrados.reduce((s, r) => s + (Number(r.aluminio) || 0), 0);
  const totalF = registrosFiltrados.reduce((s, r) => s + (Number(r.frasco) || 0), 0);

  const dadosGrafico = [
    { name: "Plástico", valor: totalP, color: "#3b82f6" },
    { name: "Alumínio", valor: totalA, color: "#f59e0b" },
    { name: "Vidro/Frasco", valor: totalF, color: "#10b981" },
  ];

  const registrosSuspeitos = registros.filter(
    (r) => r.suspeitaDuplicidade && !r.suspeitaDuplicidade.revisado
  );

  const handleExcluir = async () => {
    if (!exclusaoPendente) return;
    const { tipo, id } = exclusaoPendente;
    try {
      const colecao = tipo === "professor" ? "professores" : tipo === "turma" ? "turmas" : "alunos";
      await deleteDoc(doc(db, colecao, id));
      await carregarDadosIniciais();
    } catch {
      alert("Erro ao excluir.");
    } finally {
      setExclusaoPendente(null);
    }
  };

  const gerarPDF = () => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.setTextColor(22, 163, 74);
      pdf.text("Relatório Geral - EcoGestão Escolar", 14, 20);

      const bodyResumo = turmas.map((t) => {
        const r = registros.filter((reg) => reg.turmaId === t.id);
        const total = r.reduce(
          (s, x) => s + (Number(x.plastico || 0) + Number(x.aluminio || 0) + Number(x.frasco || 0)),
          0
        );
        return [t.nome, total, r.length];
      });

      autoTable(pdf, {
        startY: 30,
        head: [["Turma", "Total Reciclado (Itens)", "Qtd. Registros"]],
        body: bodyResumo,
        headStyles: { fillColor: [22, 163, 74] },
        theme: "striped",
      });

      pdf.save(`relatorio_escola_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF.");
    }
  };

  // ---------- Ações de conta do professor ----------
  const abrirAcaoEmail = (professor) => {
    setErroAcao("");
    setResultadoSenha(null);
    setNovoEmail(professor.email || "");
    setProfessorSelecionado({ ...professor, acao: "email" });
  };

  const abrirAcaoSenha = (professor) => {
    setErroAcao("");
    setResultadoSenha(null);
    setProfessorSelecionado({ ...professor, acao: "senha" });
  };

  const fecharModalConta = () => {
    setProfessorSelecionado(null);
    setNovoEmail("");
    setErroAcao("");
    setResultadoSenha(null);
  };

  const confirmarResetSenha = async () => {
    setProcessando(true);
    setErroAcao("");
    try {
      const token = await user.getIdToken();
      const resp = await fetch("/api/admin/reset-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: professorSelecionado.id }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro || "Falha ao resetar senha.");
      setResultadoSenha({ professor: professorSelecionado, senha: json.senhaTemporaria });
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setProcessando(false);
    }
  };

  const confirmarNovoEmail = async () => {
    if (!novoEmail.trim()) return;
    setProcessando(true);
    setErroAcao("");
    try {
      const token = await user.getIdToken();
      const resp = await fetch("/api/admin/atualizar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: professorSelecionado.id, novoEmail: novoEmail.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro || "Falha ao atualizar e-mail.");
      await carregarDadosIniciais();
      fecharModalConta();
    } catch (e) {
      setErroAcao(e.message);
    } finally {
      setProcessando(false);
    }
  };

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        ⚡ Acessando Sistema Central...
      </div>
    );
  }
  if (!ehAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Acesso Negado 🚫
      </div>
    );
  }

  const abas = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "gestao", label: "⚙️ Gestão Total" },
    { id: "professores", label: "👨‍🏫 Professores" },
    { id: "duplicidades", label: `🔁 Duplicidades${registrosSuspeitos.length ? ` (${registrosSuspeitos.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-white">
      {/* Sidebar / topbar */}
      <nav className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 lg:p-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-green-400 text-center mb-2">🛡️ EcoAdmin</h2>
        <div className="flex lg:flex-col gap-2 overflow-x-auto">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAbaAtiva(a.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                abaAtiva === a.id ? "bg-slate-700 font-semibold" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <Button onClick={gerarPDF} className="mt-2 lg:mt-auto w-full">
          📥 Baixar Relatório
        </Button>
        <div className="text-[11px] text-slate-500 text-center mt-2 truncate">Admin: {user.email}</div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {abaAtiva === "dashboard" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="text-center"><span className="text-xs text-slate-400">Total Reciclado</span><h2 className="text-2xl font-bold mt-1">{totalP + totalA + totalF}</h2></Card>
              <Card className="text-center"><span className="text-xs text-slate-400">Professores</span><h2 className="text-2xl font-bold mt-1">{professores.length}</h2></Card>
              <Card className="text-center"><span className="text-xs text-slate-400">Turmas Ativas</span><h2 className="text-2xl font-bold mt-1">{turmas.length}</h2></Card>
              <Card className="text-center"><span className="text-xs text-slate-400">Alunos Inscritos</span><h2 className="text-2xl font-bold mt-1">{alunos.length}</h2></Card>
            </div>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold">📈 Desempenho por Categoria</h3>
                <Select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} className="sm:w-56">
                  <option value="todas">Todas as Turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </Select>
              </div>
              <div style={{ height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff" }} />
                    <Bar dataKey="valor" radius={[10, 10, 0, 0]}>
                      {dadosGrafico.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {abaAtiva === "gestao" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="max-h-[70vh] overflow-y-auto">
              <h3 className="font-semibold mb-3">👨‍🏫 Professores</h3>
              {professores.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-800 py-2 text-sm last:border-0">
                  <span className="truncate">{p.nome}</span>
                  <button
                    className="text-red-400 border border-red-500/40 bg-red-500/10 rounded-md px-2 py-0.5 text-xs"
                    onClick={() => setExclusaoPendente({ tipo: "professor", id: p.id, label: p.nome })}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </Card>
            <Card className="max-h-[70vh] overflow-y-auto">
              <h3 className="font-semibold mb-3">🏫 Turmas</h3>
              {turmas.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-800 py-2 text-sm last:border-0">
                  <span className="truncate">{t.nome}</span>
                  <button
                    className="text-red-400 border border-red-500/40 bg-red-500/10 rounded-md px-2 py-0.5 text-xs"
                    onClick={() => setExclusaoPendente({ tipo: "turma", id: t.id, label: t.nome })}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </Card>
            <Card className="max-h-[70vh] overflow-y-auto">
              <h3 className="font-semibold mb-3">👨‍🎓 Alunos (últimos 50)</h3>
              {alunos.slice(0, 50).map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-slate-800 py-2 text-sm last:border-0">
                  <span className="truncate">{a.nome}</span>
                  <button
                    className="text-red-400 border border-red-500/40 bg-red-500/10 rounded-md px-2 py-0.5 text-xs"
                    onClick={() => setExclusaoPendente({ tipo: "aluno", id: a.id, label: a.nome })}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {abaAtiva === "professores" && (
          <Card>
            <h3 className="font-semibold mb-1">👨‍🏫 Contas dos professores</h3>
            <p className="text-xs text-slate-500 mb-4">
              Por segurança, ninguém — nem o administrador — pode ver a senha original de um
              professor (ela é armazenada de forma irreversível). Em vez disso, você pode gerar
              uma <strong>senha temporária</strong> aqui e entregá-la pessoalmente, ou corrigir o
              e-mail de quem digitou errado no cadastro.
            </p>
            {professores.length === 0 ? (
              <EmptyState icon="👨‍🏫" title="Nenhum professor cadastrado ainda" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                      <th className="py-2">Nome</th>
                      <th className="py-2">E-mail</th>
                      <th className="py-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professores.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800 last:border-0">
                        <td className="py-2.5">{p.nome}</td>
                        <td className="py-2.5 text-slate-400">{p.email}</td>
                        <td className="py-2.5 text-center whitespace-nowrap">
                          <Button variant="outline" className="!px-2.5 !py-1 !text-xs mr-2" onClick={() => abrirAcaoEmail(p)}>
                            Corrigir e-mail
                          </Button>
                          <Button variant="secondary" className="!px-2.5 !py-1 !text-xs" onClick={() => abrirAcaoSenha(p)}>
                            Resetar senha
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {abaAtiva === "duplicidades" && (
          <Card>
            <h3 className="font-semibold mb-1">🔁 Registros com possível duplicidade</h3>
            <p className="text-xs text-slate-500 mb-4">
              Estes registros não foram apagados — apenas sinalizados para revisão, pois foram
              lançados para o mesmo aluno, no mesmo dia, próximo de outro registro já existente.
            </p>
            {registrosSuspeitos.length === 0 ? (
              <EmptyState icon="✅" title="Nenhuma duplicidade pendente de revisão" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                      <th className="py-2">Data</th>
                      <th className="py-2">Aluno</th>
                      <th className="py-2">Turma</th>
                      <th className="py-2">Nível</th>
                      <th className="py-2">🧴</th>
                      <th className="py-2">🥫</th>
                      <th className="py-2">🌸</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosSuspeitos.map((r) => {
                      const nomeAluno = alunos.find((a) => a.id === r.alunoId)?.nome || "—";
                      const nomeTurma = turmas.find((t) => t.id === r.turmaId)?.nome || "—";
                      return (
                        <tr key={r.id} className="border-b border-slate-800 last:border-0">
                          <td className="py-2.5">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2.5">{nomeAluno}</td>
                          <td className="py-2.5">{nomeTurma}</td>
                          <td className="py-2.5">
                            <Badge tone={r.suspeitaDuplicidade.nivel === "forte" ? "red" : "amber"}>
                              {r.suspeitaDuplicidade.nivel === "forte" ? "Idêntico" : "Mesmo dia"}
                            </Badge>
                          </td>
                          <td className="py-2.5">{r.plastico}</td>
                          <td className="py-2.5">{r.aluminio}</td>
                          <td className="py-2.5">{r.frasco}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </main>

      {/* Modal: ação de conta do professor */}
      <Modal
        open={!!professorSelecionado}
        onClose={fecharModalConta}
        title={
          professorSelecionado?.acao === "senha"
            ? `Resetar senha — ${professorSelecionado?.nome}`
            : `Corrigir e-mail — ${professorSelecionado?.nome}`
        }
        footer={
          resultadoSenha ? (
            <Button variant="secondary" onClick={fecharModalConta}>Fechar</Button>
          ) : professorSelecionado?.acao === "senha" ? (
            <>
              <Button variant="ghost" onClick={fecharModalConta}>Cancelar</Button>
              <Button variant="danger" onClick={confirmarResetSenha} disabled={processando}>
                {processando ? "Gerando..." : "Gerar nova senha"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={fecharModalConta}>Cancelar</Button>
              <Button onClick={confirmarNovoEmail} disabled={processando}>
                {processando ? "Salvando..." : "Salvar novo e-mail"}
              </Button>
            </>
          )
        }
      >
        {erroAcao && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
            {erroAcao}
          </p>
        )}

        {resultadoSenha ? (
          <div className="space-y-3">
            <p>Senha temporária gerada para <strong className="text-white">{resultadoSenha.professor.nome}</strong>:</p>
            <div className="text-center text-lg font-mono font-bold text-green-400 bg-slate-950 border border-slate-700 rounded-xl py-3 tracking-wider">
              {resultadoSenha.senha}
            </div>
            <p className="text-[11px] text-slate-500">
              Entregue esta senha pessoalmente ao professor. Ela só é exibida uma vez — depois de
              fechar esta janela, não será possível recuperá-la novamente (será preciso gerar
              outra). Recomende que ele a troque no primeiro acesso.
            </p>
          </div>
        ) : professorSelecionado?.acao === "senha" ? (
          <p>
            Isso vai invalidar a senha atual de <strong className="text-white">{professorSelecionado?.nome}</strong> e
            gerar uma nova senha temporária, mostrada apenas para você. Use isso quando o
            professor perdeu a senha e não consegue receber o e-mail de recuperação.
          </p>
        ) : (
          <div className="space-y-3">
            <p>Corrija o e-mail cadastrado por engano. O professor deverá usar o novo e-mail para fazer login.</p>
            <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
          </div>
        )}
      </Modal>

      {/* Modal: confirmar exclusão */}
      <Modal
        open={!!exclusaoPendente}
        onClose={() => setExclusaoPendente(null)}
        title="Confirmar exclusão"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExclusaoPendente(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleExcluir}>Excluir</Button>
          </>
        }
      >
        {exclusaoPendente && (
          <p>
            Tem certeza que deseja excluir {exclusaoPendente.tipo} <strong className="text-white">{exclusaoPendente.label}</strong>?
            Esta ação é irreversível.
          </p>
        )}
      </Modal>
    </div>
  );
}
