"use client"

import { useEffect, useState } from "react";
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
    const q = query(collection(db, "turmas"), where("professorId", "==", user.uid));
    const dados = await getDocs(q);

    if (!dados.empty) {
      const turmaData = { id: dados.docs[0].id, ...dados.docs[0].data() };
      setTurma(turmaData);
      carregarAlunos(turmaData.id);
      carregarRegistros(turmaData.id);
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

  const criarTurma = async () => {
    if (!nomeTurma) return;
    const docRef = await addDoc(collection(db, "turmas"), {
      nome: nomeTurma,
      professorId: user.uid
    });
    setTurma({ id: docRef.id, nome: nomeTurma });
    setNomeTurma("");
  };

  const adicionarAluno = async () => {
    if (!novoAluno) return;
    await addDoc(collection(db, "alunos"), {
      nome: novoAluno,
      turmaId: turma.id
    });
    setNovoAluno("");
    carregarAlunos(turma.id);
  };

  const registrarOuEditar = async () => {
    if (!alunoId) return alert("Selecione um aluno");

    const dados = {
      alunoId,
      turmaId: turma.id,
      professorId: user.uid,
      data: Date.now(), // Aqui salvamos a data atual
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
      setPlastico("");
      setAluminio("");
      setFrasco("");
      setAlunoId("");
      carregarRegistros(turma.id);
    } catch (e) {
      alert("Erro ao salvar.");
    }
  };

  const deletarRegistro = async (id) => {
    if (confirm("Deseja realmente excluir este registro?")) {
      await deleteDoc(doc(db, "registros", id));
      carregarRegistros(turma.id);
    }
  };

  const prepararEdicao = (reg) => {
    setEditandoId(reg.id);
    setAlunoId(reg.alunoId);
    setPlastico(reg.plastico);
    setAluminio(reg.aluminio);
    setFrasco(reg.frasco);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return "--/--/--";
    const data = new Date(timestamp);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = String(data.getFullYear()).slice(-2);
    return `${dia}/${mes}/${ano}`;
  };

  const sair = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const registrosFiltrados = registros.filter(reg => {
    const nomeAluno = alunos.find(a => a.id === reg.alunoId)?.nome || "";
    return nomeAluno.toLowerCase().includes(busca.toLowerCase());
  });

  const totalPlastico = registros.reduce((a, b) => a + (b.plastico || 0), 0);
  const totalAluminio = registros.reduce((a, b) => a + (b.aluminio || 0), 0);
  const totalFrasco = registros.reduce((a, b) => a + (b.frasco || 0), 0);

  const ranking = alunos.map(aluno => {
    const total = registros
      .filter(r => r.alunoId === aluno.id)
      .reduce((s, r) => s + ((r.plastico || 0) + (r.aluminio || 0) + (r.frasco || 0)), 0);
    return { nome: aluno.nome, total };
  }).sort((a, b) => b.total - a.total);

  const [editandoAlunoId, setEditandoAlunoId] = useState(null);

// Função para Deletar Aluno
const deletarAluno = async (id) => {
  if (confirm("Ao excluir o aluno, os registros de coleta dele continuarão no histórico, mas sem nome. Confirmar?")) {
    await deleteDoc(doc(db, "alunos", id));
    carregarAlunos(turma.id);
  }
};

// Função para preparar a edição do nome
const prepararEdicaoAluno = (aluno) => {
  setEditandoAlunoId(aluno.id);
  setNovoAluno(aluno.nome);
};

// Função para Salvar ou Atualizar Aluno
const salvarAluno = async () => {
  if (!novoAluno) return;
  
  if (editandoAlunoId) {
    // Atualizar
    await updateDoc(doc(db, "alunos", editandoAlunoId), { nome: novoAluno });
    setEditandoAlunoId(null);
  } else {
    // Criar novo
    await addDoc(collection(db, "alunos"), {
      nome: novoAluno,
      turmaId: turma.id
    });
  }
  
  setNovoAluno("");
  carregarAlunos(turma.id);
};

  const dadosGrafico = [
    { nome: "Plástico", valor: totalPlastico, color: "#3b82f6" },
    { nome: "Alumínio", valor: totalAluminio, color: "#f59e0b" },
    { nome: "Frasco", valor: totalFrasco, color: "#10b981" }
  ];

  if (!mounted) return null;
  if (loading) return <p style={{color: "#fff", padding: "20px"}}>Carregando...</p>;
  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🌎 EcoGestão Escolar</h1>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👨‍🏫 {user.email}</span>
          <button style={styles.btnSair} onClick={sair}>Sair</button>
        </div>
      </div>

      {!turma ? (
        <div style={styles.card}>
          <h2>Criar Turma</h2>
          <input 
            style={styles.input}
            placeholder="Nome da turma"
            value={nomeTurma} 
            onChange={(e) => setNomeTurma(e.target.value)} 
          />
          <button style={styles.btnPrimary} onClick={criarTurma}>Criar Turma</button>
        </div>
      ) : (
        <>
          <h2 style={styles.subtitle}>🏫 {turma.nome}</h2>

          <div style={styles.gridCards}>
            <div style={styles.cardHighlight}>♻️ Total: {totalPlastico + totalAluminio + totalFrasco}</div>
            <div style={styles.card}>🧴 Plástico: {totalPlastico}</div>
            <div style={styles.card}>🥫 Alumínio: {totalAluminio}</div>
            <div style={styles.card}>🌸 Frasco: {totalFrasco}</div>
          </div>

          <div style={styles.rowLayout}>
            <div style={{ flex: 2 }}>
              <div style={styles.card}>
                <h3>📊 Estatísticas da Turma</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosGrafico}>
                    <XAxis dataKey="nome" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="valor">
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={styles.card}>
                <h3>🏆 Ranking</h3>
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
            <h3>{editandoId ? "📝 Editar Registro" : "♻️ Nova Coleta"}</h3>
            <div style={styles.gridInputs}>
              <select style={styles.input} onChange={(e) => setAlunoId(e.target.value)} value={alunoId}>
                <option value="">Selecione o aluno</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
              <input style={styles.input} type="number" placeholder="Plástico" value={plastico} onChange={(e) => setPlastico(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Alumínio" value={aluminio} onChange={(e) => setAluminio(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Frasco" value={frasco} onChange={(e) => setFrasco(e.target.value)} />
            </div>
            <div style={styles.row}>
              <button style={styles.btnPrimary} onClick={registrarOuEditar}>
                {editandoId ? "Salvar Alterações" : "Registrar Coleta"}
              </button>
              {editandoId && <button style={styles.btnSec} onClick={() => setEditandoId(null)}>Cancelar</button>}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.headerList}>
              <h3>📑 Histórico de Lançamentos</h3>
              <input 
                style={styles.inputBusca} 
                placeholder="🔍 Filtrar por aluno..." 
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
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.slice().reverse().map((reg) => (
                    <tr key={reg.id} style={styles.tr}>
                      <td style={{...styles.td, color: "#94a3b8"}}>{formatarData(reg.data)}</td>
                      <td style={styles.td}>{alunos.find(a => a.id === reg.alunoId)?.nome || "Removido"}</td>
                      <td style={styles.td}>{reg.plastico}</td>
                      <td style={styles.td}>{reg.aluminio}</td>
                      <td style={styles.td}>{reg.frasco}</td>
                      <td style={styles.td}>
                        <button style={styles.btnActionEdit} onClick={() => prepararEdicao(reg)}>✏️</button>
                        <button style={styles.btnActionDel} onClick={() => deletarRegistro(reg.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GERENCIAR ALUNOS (CRUD COMPLETO) */}
<div style={styles.card}>
  <h3>👨‍🎓 Gerenciar Alunos da Turma</h3>
  <div style={styles.row}>
    <input 
      style={styles.input}
      placeholder="Nome do aluno"
      value={novoAluno} 
      onChange={(e) => setNovoAluno(e.target.value)} 
    />
    <button style={styles.btnPrimary} onClick={salvarAluno}>
      {editandoAlunoId ? "Atualizar" : "Adicionar"}
    </button>
    {editandoAlunoId && (
      <button style={styles.btnSec} onClick={() => {setEditandoAlunoId(null); setNovoAluno("");}}>
        Cancelar
      </button>
    )}
  </div>

  <div style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Nome do Estudante</th>
          <th style={{...styles.th, textAlign: "right"}}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {alunos.sort((a, b) => a.nome.localeCompare(b.nome)).map(a => (
          <tr key={a.id} style={styles.tr}>
            <td style={styles.td}>{a.nome}</td>
            <td style={{...styles.td, textAlign: "right"}}>
              <button 
                title="Editar Nome" 
                style={styles.btnActionEdit} 
                onClick={() => prepararEdicaoAluno(a)}
              >
                ✏️
              </button>
              <button 
                title="Remover Aluno" 
                style={styles.btnActionDel} 
                onClick={() => deletarAluno(a.id)}
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { background: "#0F172A", minHeight: "100vh", padding: "30px", color: "#fff", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  headerRight: { display: "flex", gap: "15px", alignItems: "center" },
  title: { fontSize: "28px", fontWeight: "bold", margin: 0, color: "#22c55e" },
  subtitle: { marginBottom: "20px", color: "#94a3b8" },
  userInfo: { color: "#CBD5F5", fontSize: "14px" },
  card: { background: "#1E293B", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" },
  cardHighlight: { background: "linear-gradient(135deg,#22c55e,#16a34a)", padding: "20px", borderRadius: "12px", color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: "20px" },
  gridCards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "15px", marginBottom: "20px" },
  rowLayout: { display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px" },
  input: { width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", background: "#0F172A", color: "#fff", outline: "none", boxSizing: "border-box" },
  inputBusca: { padding: "8px 15px", borderRadius: "8px", border: "1px solid #334155", background: "#0F172A", color: "#fff", outline: "none", width: "250px" },
  btnPrimary: { background: "#22c55e", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "100%" },
  btnSec: { background: "#475569", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "40%" },
  btnSair: { background: "#ef4444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" },
  gridInputs: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "10px" },
  row: { display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" },
  headerList: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" },
  rankingItem: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #334155" },
  tableResponsive: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  th: { textAlign: "left", padding: "12px", borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "14px" },
  td: { padding: "12px", borderBottom: "1px solid #334155", fontSize: "14px" },
  tr: { transition: "0.2s" },
  btnActionEdit: { background: "none", border: "none", cursor: "pointer", marginRight: "10px", fontSize: "16px" },
  btnActionDel: { background: "none", border: "none", cursor: "pointer", fontSize: "16px" },
  listItem: { padding: "10px 0", borderBottom: "1px solid #334155" }
};
