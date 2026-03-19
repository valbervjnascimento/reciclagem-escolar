"use client"

import { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function Registro() {

const [plastico,setPlastico] = useState(0)
const [aluminio,setAluminio] = useState(0)
const [frasco,setFrasco] = useState(0)

const salvar = async () => {

await addDoc(collection(db,"registros"),{
data: new Date(),
plastico: Number(plastico),
aluminio: Number(aluminio),
frasco_perfume: Number(frasco)
})

alert("Registro salvo com sucesso!")

}

return(

<div style={{padding:"20px"}}>

<h1>♻️ Registro de Reciclagem</h1>

<input 
type="number" 
placeholder="Plástico"
onChange={(e)=>setPlastico(e.target.value)}
/>

<br/><br/>

<input 
type="number" 
placeholder="Alumínio"
onChange={(e)=>setAluminio(e.target.value)}
/>

<br/><br/>

<input 
type="number" 
placeholder="Frasco de perfume"
onChange={(e)=>setFrasco(e.target.value)}
/>

<br/><br/>

<button onClick={salvar}>
Salvar
</button>

</div>

)

}