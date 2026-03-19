"use client"

import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Alunos(){

const [nome,setNome] = useState("")
const [alunos,setAlunos] = useState([])

const salvar = async ()=>{
 await addDoc(collection(db,"alunos"),{ nome })
 setNome("")
 carregar()
}

const carregar = async ()=>{
 const dados = await getDocs(collection(db,"alunos"))
 setAlunos(dados.docs.map(doc=>({...doc.data(), id:doc.id})))
}

useEffect(()=>{carregar()},[])

return(
<div>
<h1>Alunos</h1>

<input value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Nome"/>
<button onClick={salvar}>Salvar</button>

<ul>
{alunos.map(a=>(
<li key={a.id}>{a.nome}</li>
))}
</ul>

</div>
)
}