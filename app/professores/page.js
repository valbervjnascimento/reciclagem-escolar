"use client"

import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Professores(){

const [nome,setNome] = useState("")
const [lista,setLista] = useState([])

const salvar = async ()=>{
 await addDoc(collection(db,"professores"),{ nome })
 setNome("")
 carregar()
}

const carregar = async ()=>{
 const dados = await getDocs(collection(db,"professores"))
 setLista(dados.docs.map(doc=>({...doc.data(), id:doc.id})))
}

useEffect(()=>{carregar()},[])

return(
<div>
<h1>Professores</h1>

<input value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Nome"/>
<button onClick={salvar}>Salvar</button>

<ul>
{lista.map(p=>(
<li key={p.id}>{p.nome}</li>
))}
</ul>

</div>
)
}