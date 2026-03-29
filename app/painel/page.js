"use client"

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

import { db, auth } from "../../firebase";
import { 
  collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc 
} from "firebase/firestore";

import { signOut } from "firebase/auth";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

export default function Painel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [turma, setTurma] = useState(null);
  const [nomeTurma, setNomeTurma] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [novoAluno, setNovoAluno] = useState("");
  const [editandoAlunoId, setEditandoAlunoId] = useState(null);

  const [alunoId, setAlunoId] = useState("");
  const [plastico, setPlastico] = useState("");
  const [aluminio, setAluminio] = useState("");
  const [frasco, setFrasco] = useState("");

  const [registros, setRegistros] = useState([]);
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) carregarTurma();
  }, [user]);

  const carregarTurma = async () => {
    try {
      const q = query(collection(db, "turmas"), where("professorId", "==", user.uid));
      const dados = await getDocs(q);

      if (!dados.empty) {
        const turmaData = { id: dados.docs[0].id, ...dados.docs[0].data() };
        setTurma(turmaData);
        await Promise.all([carregarAlunos(turmaData.id), carregarRegistros(turmaData.id)]);
      }
    } catch (error) {
      console.error("Erro ao carregar turma:", error);
    }
  };

  const carregarAlunos = async (turmaId) => {
    const q = query(collection(db, "alunos"), where("turmaId", "==", turmaId));
    const dados = await getDocs(q);
    setAlunos(dados.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const carregarRegistros = async (turmaId) => {
    const q = query(collection(db, "registros"), where("turmaId", "==", turmaId));
    const dados = await getDocs(q);
    setRegistros(dados.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Funções de Gerenciamento de Alunos (CRUD)
  const salvarAluno = async () => {
    if (!novoAluno.trim()) return;
    try {
      if (editandoAlunoId) {
        await updateDoc(doc(db, "alunos", editandoAlunoId), { nome: novoAluno });
        setEditandoAlunoId(null);
      } else {
        await addDoc(collection(db, "alunos"), {
          nome: novoAluno,
          turmaId: turma.id
        });
      }
      setNovoAluno("");
      await carregarAlunos(turma.id);
    } catch (e) {
      alert("Erro ao salvar aluno.");
    }
  };

  const deletarAluno = async (id) => {
    if (confirm("Deseja remover este aluno? Os registros de coleta permanecerão no histórico.")) {
      await deleteDoc(doc(db, "alunos", id));
      await carregarAlunos(turma.id);
    }
  };

  // Cálculos Otimizados com useMemo
  const stats = useMemo(() => {
    const p = registros.reduce((a, b) => a + (Number(b.plastico) || 0), 0);
    const al = registros.reduce((a, b) => a + (Number(b.aluminio) || 0), 0);
    const f = registros.reduce((a, b) => a + (Number(b.frasco) || 0), 0);
    return { p, al, f, total: p + al + f };
  }, [registros]);

  const ranking = useMemo(() => {
    return alunos.map(aluno => {
      const total = registros
        .filter(r => r.alunoId === aluno.id)
        .reduce((s, r) => s + (Number(r.plastico) || 0) + (Number(r.aluminio) || 0) + (Number(r.frasco) || 0), 0);
      return { nome: aluno.nome, total };
    }).sort((a, b) => b.total - a.total);
  }, [alunos, registros]);

  const registrosFiltrados = useMemo(() => {
    return registros.filter(reg => {
      const nomeAluno = alunos.find(a => a.id === reg.alunoId)?.nome || "Removido";
      return nomeAluno.toLowerCase().includes(busca.toLowerCase());
    }).reverse();
  }, [registros, alunos, busca]);

  const registrarOuEditarColeta = async () => {
    if (!alunoId) return alert("Selecione um aluno");
    const dados = {
      alunoId,
      turmaId: turma.id,
      professorId: user.uid,
      data: editandoId ? registros.find(r => r.id === editandoId).data : Date.now(),
      plastico: Number(plastico) || 0,
      aluminio: Number(aluminio) || 0,
      frasco: Number(frasco) || 0
    };

    try {
      if (editandoId) {
        await updateDoc(doc(db, "registros", editandoId), dados);
        setEditandoId(null);
      } else {
        await addDoc(collection(db, "registros"), dados);
      }
      setPlastico(""); setAluminio(""); setFrasco(""); setAlunoId("");
      await carregarRegistros(turma.id);
    } catch (e) {
      alert("Erro ao salvar coleta.");
    }
  };

  const sair = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!mounted) return null;
  if (loading) return <div style={styles.loading}>Carregando EcoGestão...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🌎 EcoGestão Escolar</h1>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👨‍🏫 {user?.email}</span>
          <button style={styles.btnSair} onClick={sair}>Sair</button>
        </div>
      </header>

      {!turma ? (
        <div style={styles.cardCenter}>
          <h2>Bem-vindo, Professor!</h2>
          <p>Crie sua primeira turma para começar o projeto.</p>
          <input 
            style={styles.input}
            placeholder="Ex: 7º Ano A - 2026"
            value={nomeTurma} 
            onChange={(e) => setNomeTurma(e.target.value)} 
          />
          <button style={styles.btnPrimary} onClick={async () => {
             if (!nomeTurma) return;
             const docRef = await addDoc(collection(db, "turmas"), { nome: nomeTurma, professorId: user.uid });
             setTurma({ id: docRef.id, nome: nomeTurma });
          }}>Criar Turma</button>
        </div>
      ) : (
        <>
          <h2 style={styles.subtitle}>🏫 {turma.nome}</h2>

          <section style={styles.gridCards}>
            <div style={styles.cardHighlight}>♻️ Total Geral: {stats.total}</div>
            <div style={{...styles.cardSimple, borderColor: "#3b82f6"}}>🧴 Plástico: {stats.p}</div>
            <div style={{...styles.cardSimple, borderColor: "#f59e0b"}}>🥫 Alumínio: {stats.al}</div>
            <div style={{...styles.cardSimple, borderColor: "#10b981"}}>🌸 Frasco: {stats.f}</div>
          </section>

          <div style={styles.rowLayout}>
            <div style={{ flex: 2 }}>
              <div style={styles.card}>
                <h3>📊 Materiais Coletados</h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { nome: "Plástico", valor: stats.p, color: "#3b82f6" },
                      { nome: "Alumínio", valor: stats.al, color: "#f59e0b" },
                      { nome: "Frasco", valor: stats.f, color: "#10b981" }
                    ]}>
                      <XAxis dataKey="nome" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                        {[1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#3b82f6", "#f59e0b", "#10b981"][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={styles.card}>
                <h3>🏆 Top 5 Alunos</h3>
                {ranking.slice(0, 5).map((r, i) => (
                  <div key={i} style={styles.rankingItem}>
                    <span>{i + 1}º {r.nome}</span>
                    <strong style={{color: '#22c55e'}}>{r.total}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3>{editandoId ? "📝 Editar Registro" : "♻️ Registrar Nova Coleta"}</h3>
            <div style={styles.gridInputs}>
              <select style={styles.input} onChange={(e) => setAlunoId(e.target.value)} value={alunoId}>
                <option value="">Selecione o aluno</option>
                {alunos.sort((a,b) => a.nome.localeCompare(b.nome)).map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
              <input style={styles.input} type="number" placeholder="Plástico" value={plastico} onChange={(e) => setPlastico(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Alumínio" value={aluminio} onChange={(e) => setAluminio(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Frasco" value={frasco} onChange={(e) => setFrasco(e.target.value)} />
            </div>
            <div style={styles.row}>
              <button style={styles.btnPrimary} onClick={registrarOuEditarColeta}>
                {editandoId ? "Salvar Alterações" : "Confirmar Lançamento"}
              </button>
              {editandoId && <button style={styles.btnSec} onClick={() => {setEditandoId(null); setPlastico(""); setAluminio(""); setFrasco(""); setAlunoId("");}}>Cancelar</button>}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.headerList}>
              <h3>📑 Histórico Recente</h3>
              <input 
                style={styles.inputBusca} 
                placeholder="🔍 Buscar aluno..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Aluno</th>
                    <th style={styles.th}>P</th>
                    <th style={styles.th}>A</th>
                    <th style={styles.th}>F</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((reg) => (
                    <tr key={reg.id} style={styles.tr}>
                      <td style={{...styles.td, color: "#94a3b8"}}>{new Date(reg.data).toLocaleDateString('pt-BR')}</td>
                      <td style={styles.td}>{alunos.find(a => a.id === reg.alunoId)?.nome || "Removido"}</td>
                      <td style={styles.td}>{reg.plastico}</td>
                      <td style={styles.td}>{reg.aluminio}</td>
                      <td style={styles.td}>{reg.frasco}</td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <button style={styles.btnActionEdit} onClick={() => {
                           setEditandoId(reg.id);
                           setAlunoId(reg.alunoId);
                           setPlastico(reg.plastico);
                           setAluminio(reg.aluminio);
                           setFrasco(reg.frasco);
                           window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}>✏️</button>
                        <button style={styles.btnActionDel} onClick={async () => {
                           if(confirm("Excluir registro?")) {
                             await deleteDoc(doc(db, "registros", reg.id));
                             carregarRegistros(turma.id);
                           }
                        }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <h3>👨‍🎓 Gestão de Alunos</h3>
            <div style={styles.row}>
              <input 
                style={styles.input}
                placeholder="Nome completo do aluno"
                value={novoAluno} 
                onChange={(e) => setNovoAluno(e.target.value)} 
              />
              <button style={styles.btnPrimary} onClick={salvarAluno}>
                {editandoAlunoId ? "Atualizar" : "Cadastrar"}
              </button>
            </div>
            <div style={{maxHeight: '200px', overflowY: 'auto', marginTop: '15px'}}>
              {alunos.sort((a,b) => a.nome.localeCompare(b.nome)).map(a => (
                <div key={a.id} style={styles.listItem}>
                  <span>{a.nome}</span>
                  <div>
                    <button style={styles.btnActionEdit} onClick={() => {setEditandoAlunoId(a.id); setNovoAluno(a.nome);}}>✏️</button>
                    <button style={styles.btnActionDel} onClick={() => deletarAluno(a.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#0F172A", minHeight: "100vh", padding: "20px", color: "#fff", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #1E293B", paddingBottom: "15px" },
  headerRight: { display: "flex", gap: "15px", alignItems: "center" },
  title: { fontSize: "24px", fontWeight: "bold", margin: 0, color: "#22c55e" },
  subtitle: { marginBottom: "20px", color: "#94a3b8", fontSize: "18px" },
  userInfo: { color: "#94a3b8", fontSize: "13px" },
  loading: { background: "#0F172A", height: "100vh", color: "#22c55e", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px" },
  card: { background: "#1E293B", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
  cardCenter: { background: "#1E293B", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", margin: "100px auto" },
  cardHighlight: { background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", padding: "20px", borderRadius: "12px", color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: "22px" },
  cardSimple: { background: "#1E293B", padding: "15px", borderRadius: "12px", borderLeft: "4px solid", textAlign: "center", fontSize: "16px" },
  gridCards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "25px" },
  rowLayout: { display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", background: "#0F172A", color: "#fff", outline: "none", fontSize: "14px" },
  inputBusca: { padding: "8px 15px", borderRadius: "8px", border: "1px solid #334155", background: "#0F172A", color: "#fff", width: "200px" },
  btnPrimary: { background: "#22c55e", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" },
  btnSec: { background: "#475569", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  btnSair: { background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  gridInputs: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "15px" },
  row: { display: "flex", gap: "10px", marginTop: "10px" },
  headerList: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  rankingItem: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #334155" },
  tableResponsive: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px", borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "13px", textTransform: "uppercase" },
  td: { padding: "12px", borderBottom: "1px solid #334155", fontSize: "14px" },
  tr: { hover: { background: "#2D3748" } },
  btnActionEdit: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "5px" },
  btnActionDel: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "5px" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #334155" }
};