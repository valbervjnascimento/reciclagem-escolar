"use client"

import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { db } from "../../firebase";
import { 
  collection, getDocs, doc, deleteDoc 
} from "firebase/firestore";

// IMPORTAÇÃO CORRIGIDA PARA NEXT.JS/TURBOPACK
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminProfissional() {
  const { user, loading } = useAuth();
  
  // Estados de Dados
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [registros, setRegistros] = useState([]);
  
  // Estados de Interface
  const [filtroTurma, setFiltroTurma] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("dashboard");

  const ADMIN_EMAILS = ["valbervjnascimento@gmail.com"];

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
      carregarDadosIniciais();
    }
  }, [user]);

  const carregarDadosIniciais = async () => {
    setCarregando(true);
    try {
      const [pSnap, tSnap, aSnap, rSnap] = await Promise.all([
        getDocs(collection(db, "professores")),
        getDocs(collection(db, "turmas")),
        getDocs(collection(db, "alunos")),
        getDocs(collection(db, "registros"))
      ]);

      setProfessores(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTurmas(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAlunos(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRegistros(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  };

  // --- LÓGICA DE FILTRAGEM ---
  const registrosFiltrados = filtroTurma === "todas" 
    ? registros 
    : registros.filter(r => r.turmaId === filtroTurma);

  const totalP = registrosFiltrados.reduce((s, r) => s + (Number(r.plastico) || 0), 0);
  const totalA = registrosFiltrados.reduce((s, r) => s + (Number(r.aluminio) || 0), 0);
  const totalF = registrosFiltrados.reduce((s, r) => s + (Number(r.frasco) || 0), 0);

  const dadosGrafico = [
    { name: "Plástico", valor: totalP, color: "#3b82f6" },
    { name: "Alumínio", valor: totalA, color: "#f59e0b" },
    { name: "Vidro/Frasco", valor: totalF, color: "#10b981" }
  ];

  // --- FUNÇÕES DE EXCLUSÃO ---
  const handleExcluir = async (tipo, id) => {
    if (!confirm(`Tem certeza que deseja excluir este ${tipo}? Esta ação é irreversível.`)) return;
    
    try {
      const colecao = tipo === "professor" ? "professores" : tipo === "turma" ? "turmas" : "alunos";
      await deleteDoc(doc(db, colecao, id));
      alert("Excluído com sucesso!");
      carregarDadosIniciais();
    } catch (e) {
      alert("Erro ao excluir.");
    }
  };

  // --- RELATÓRIO PDF (CORRIGIDO) ---
  const gerarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(22, 163, 74);
      doc.text("Relatório Geral - EcoGestão Escolar", 14, 20);
      
      const bodyResumo = turmas.map(t => {
        const r = registros.filter(reg => reg.turmaId === t.id);
        const total = r.reduce((s, x) => s + (Number(x.plastico || 0) + Number(x.aluminio || 0) + Number(x.frasco || 0)), 0);
        return [t.nome, total, r.length];
      });

      // CHAMADA CORRIGIDA: autoTable(doc, { ... })
      autoTable(doc, {
        startY: 30,
        head: [['Turma', 'Total Reciclado (Itens)', 'Qtd. Registros']],
        body: bodyResumo,
        headStyles: { fillColor: [22, 163, 74] },
        theme: 'striped'
      });

      doc.save(`relatorio_escola_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Verifique o console.");
    }
  };

  if (loading || carregando) return <div style={styles.loading}>⚡ Acessando Sistema Central...</div>;
  if (!user || !ADMIN_EMAILS.includes(user.email)) return <div style={styles.loading}>Acesso Negado 🚫</div>;

  return (
    <div style={styles.container}>
      
      {/* SIDEBAR */}
      <nav style={styles.sidebar}>
        <h2 style={styles.logo}>🛡️ EcoAdmin</h2>
        <button onClick={() => setAbaAtiva("dashboard")} style={abaAtiva === "dashboard" ? styles.navBtnActive : styles.navBtn}>📊 Dashboard</button>
        <button onClick={() => setAbaAtiva("gestao")} style={abaAtiva === "gestao" ? styles.navBtnActive : styles.navBtn}>⚙️ Gestão Total</button>
        <button onClick={gerarPDF} style={styles.pdfBtn}>📥 Baixar Relatório</button>
        <div style={styles.userBadge}>Admin: {user.email}</div>
      </nav>

      {/* CONTEÚDO */}
      <main style={styles.content}>
        
        {abaAtiva === "dashboard" ? (
          <>
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}><span>Total Reciclado</span><h2>{totalP + totalA + totalF}</h2></div>
              <div style={styles.kpiCard}><span>Professores</span><h2>{professores.length}</h2></div>
              <div style={styles.kpiCard}><span>Turmas Ativas</span><h2>{turmas.length}</h2></div>
              <div style={styles.kpiCard}><span>Alunos Inscritos</span><h2>{alunos.length}</h2></div>
            </div>

            <div style={styles.chartSection}>
              <div style={styles.chartHeader}>
                <h3>📈 Desempenho por Categoria</h3>
                <select style={styles.select} value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
                  <option value="todas">Todas as Turmas</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div style={{ height: 350, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
                    <Bar dataKey="valor" radius={[10, 10, 0, 0]}>
                      {dadosGrafico.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.gestaoGrid}>
            <section style={styles.cardGestao}>
              <h3>👨‍🏫 Professores</h3>
              {professores.map(p => (
                <div key={p.id} style={styles.itemGestao}>
                  <span>{p.nome}</span>
                  <button onClick={() => handleExcluir("professor", p.id)} style={styles.btnExcluir}>Remover</button>
                </div>
              ))}
            </section>

            <section style={styles.cardGestao}>
              <h3>🏫 Turmas</h3>
              {turmas.map(t => (
                <div key={t.id} style={styles.itemGestao}>
                  <span>{t.nome}</span>
                  <button onClick={() => handleExcluir("turma", t.id)} style={styles.btnExcluir}>Remover</button>
                </div>
              ))}
            </section>

            <section style={styles.cardGestao}>
              <h3>👨‍🎓 Alunos (Últimos 50)</h3>
              {alunos.slice(0, 50).map(a => (
                <div key={a.id} style={styles.itemGestao}>
                  <span>{a.nome}</span>
                  <button onClick={() => handleExcluir("aluno", a.id)} style={styles.btnExcluir}>Remover</button>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#0F172A", color: "#fff", fontFamily: "sans-serif" },
  loading: { height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", background: "#0F172A", color: "#fff" },
  sidebar: { width: "260px", background: "#1E293B", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", borderRight: "1px solid #334155" },
  logo: { fontSize: "22px", fontWeight: "bold", color: "#22c55e", marginBottom: "30px", textAlign: "center" },
  navBtn: { background: "none", border: "none", color: "#94a3b8", padding: "12px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "16px" },
  navBtnActive: { background: "#334155", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
  pdfBtn: { marginTop: "auto", background: "#22c55e", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  userBadge: { marginTop: "20px", fontSize: "11px", color: "#64748b", textAlign: "center", overflow: "hidden" },
  content: { flex: 1, padding: "40px", overflowY: "auto" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "30px" },
  kpiCard: { background: "#1E293B", padding: "20px", borderRadius: "16px", border: "1px solid #334155", textAlign: "center" },
  chartSection: { background: "#1E293B", padding: "30px", borderRadius: "20px", border: "1px solid #334155" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  select: { background: "#0F172A", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #334155", outline: "none" },
  gestaoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px" },
  cardGestao: { background: "#1E293B", padding: "20px", borderRadius: "16px", border: "1px solid #334155", maxHeight: "70vh", overflowY: "auto" },
  itemGestao: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #334155", alignItems: "center", fontSize: "14px" },
  btnExcluir: { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }
};