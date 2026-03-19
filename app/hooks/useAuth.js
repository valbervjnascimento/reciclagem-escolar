"use client"

import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function useAuth(){

const [user,setUser] = useState(null)
const [loading,setLoading] = useState(true)

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(usuario)=>{
  setUser(usuario)
  setLoading(false)
})

return ()=>unsubscribe()

},[])

return { user, loading }

}