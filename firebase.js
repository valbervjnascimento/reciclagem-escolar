import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJ-XzaRQFasFFHu6UIj75dM4yzPXBoEqg",
  authDomain: "reciclagem-escolar.firebaseapp.com",
  projectId: "reciclagem-escolar",
  storageBucket: "reciclagem-escolar.firebasestorage.app",
  messagingSenderId: "887853953872",
  appId: "1:887853953872:web:47f7206af6278478c9f255"
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// 🔥 AQUI ESTÁ O MAIS IMPORTANTE
export const db = getFirestore(app);
export const auth = getAuth(app);