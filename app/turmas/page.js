"use client"

import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Turmas(){

const [nome,setNome] = useState("")
const [turmas,setTurmas] = useState([])

const salvar = async ()=>{
 await addDoc(collection(db,"turmas"),{ nome })
 setNome("")
 carregar()
}

const carregar = async ()=>{
 const dados = await getDocs(collection(db,"turmas"))
 setTurmas(dados.docs.map(doc=>({...doc.data(), id:doc.id})))
}

useEffect(()=>{carregar()},[])

return(
<div>
<h1>Turmas</h1>

<input value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Nome da turma"/>
<button onClick={salvar}>Salvar</button>

<ul>
{turmas.map(t=>(
<li key={t.id}>{t.nome}</li>
))}
</ul>

</div>
)
}