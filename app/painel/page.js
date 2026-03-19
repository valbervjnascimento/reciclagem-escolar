"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

import { db, auth } from "../../firebase";
import { 
  collection, addDoc, getDocs, query, where 
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) carregarTurma();
  }, [user]);

  if (!mounted) return null;
  if (loading) return <p style={{color: "#fff", padding: "20px"}}>Carregando...</p>;
  if (!user) return null;

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
    setRegistros(dados.docs.map(doc => doc.data()));
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

  const registrar = async () => {
    if (!alunoId) return alert("Selecione um aluno");

    await addDoc(collection(db, "registros"), {
      alunoId,
      turmaId: turma.id,
      professorId: user.uid,
      data: Date.now(),
      plastico: Number(plastico) || 0,
      aluminio: Number(aluminio) || 0,
      frasco: Number(frasco) || 0
    });

    alert("Registro salvo!");
    setPlastico("");
    setAluminio("");
    setFrasco("");
    carregarRegistros(turma.id);
  };

  const sair = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Cálculos
  const totalPlastico = registros.reduce((a, b) => a + (b.plastico || 0), 0);
  const totalAluminio = registros.reduce((a, b) => a + (b.aluminio || 0), 0);
  const totalFrasco = registros.reduce((a, b) => a + (b.frasco || 0), 0);

  const ranking = alunos.map(aluno => {
    const total = registros
      .filter(r => r.alunoId === aluno.id)
      .reduce((s, r) => s + ((r.plastico || 0) + (r.aluminio || 0) + (r.frasco || 0)), 0);
    return { nome: aluno.nome, total };
  }).sort((a, b) => b.total - a.total);

  const dadosGrafico = [
    { nome: "Plástico", valor: totalPlastico, color: "#3b82f6" },
    { nome: "Alumínio", valor: totalAluminio, color: "#f59e0b" },
    { nome: "Frasco", valor: totalFrasco, color: "#10b981" }
  ];

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

          <div style={styles.grid}>
            <div style={styles.cardHighlight}>♻️ Total: {totalPlastico + totalAluminio + totalFrasco}</div>
            <div style={styles.card}>🧴 Plástico: {totalPlastico}</div>
            <div style={styles.card}>🥫 Alumínio: {totalAluminio}</div>
            <div style={styles.card}>🌸 Frasco: {totalFrasco}</div>
          </div>

          <div style={styles.card}>
            <h3>📊 Reciclagem</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosGrafico}>
                <XAxis dataKey="nome" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none' }} />
                <Bar dataKey="valor">
                  {dadosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <h3>🏆 Ranking</h3>
            {ranking.map((r, i) => (
              <p key={i} style={styles.rankingItem}>
                {i + 1}º - {r.nome} <strong>({r.total})</strong>
              </p>
            ))}
          </div>

          <div style={styles.card}>
            <h3>👨‍🎓 Gerenciar Alunos</h3>
            <div style={styles.row}>
              <input 
                style={styles.input}
                placeholder="Nome do aluno"
                value={novoAluno} 
                onChange={(e) => setNovoAluno(e.target.value)} 
              />
              <button style={styles.btnPrimary} onClick={adicionarAluno}>Adicionar</button>
            </div>
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {alunos.map(a => (
                <li key={a.id} style={styles.listItem}>{a.nome}</li>
              ))}
            </ul>
          </div>

          <div style={styles.card}>
            <h3>♻️ Registrar Coleta</h3>
            <select style={styles.input} onChange={(e) => setAlunoId(e.target.value)} value={alunoId}>
              <option value="">Selecione o aluno</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
            <div style={styles.gridInputs}>
              <input style={styles.input} type="number" placeholder="Plástico" value={plastico} onChange={(e) => setPlastico(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Alumínio" value={aluminio} onChange={(e) => setAluminio(e.target.value)} />
              <input style={styles.input} type="number" placeholder="Frasco" value={frasco} onChange={(e) => setFrasco(e.target.value)} />
            </div>
            <button style={styles.btnPrimary} onClick={registrar}>Salvar Registro</button>
          </div>
        </>
      )}
    </div>
  );
}

// 🎨 ESTILOS ORGANIZADOS EM UM OBJETO ÚNICO
const styles = {
  container: {
    background: "#0F172A",
    minHeight: "100vh",
    padding: "30px",
    color: "#fff",
    fontFamily: "sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  headerRight: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0
  },
  subtitle: {
    marginBottom: "20px"
  },
  userInfo: {
    color: "#CBD5F5"
  },
  card: {
    background: "#1E293B",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
  },
  cardHighlight: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    color: "#fff",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box"
  },
  btnPrimary: {
    background: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    fontWeight: "bold",
    width: "100%"
  },
  btnSair: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "15px",
    marginBottom: "20px"
  },
  gridInputs: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "10px"
  },
  row: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  listItem: {
    padding: "10px 0",
    borderBottom: "1px solid #334155"
  },
  rankingItem: {
    padding: "6px 0",
    margin: 0
  }
};