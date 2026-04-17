// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXGh45tZblm9evrz1keyu06-HPj_njwVA",
  authDomain: "managemeapp-6380a.firebaseapp.com",
  projectId: "managemeapp-6380a",
  storageBucket: "managemeapp-6380a.firebasestorage.app",
  messagingSenderId: "199497521959",
  appId: "1:199497521959:web:dec9985dabc812a7cc2702",
  measurementId: "G-NJ6G1X143L"
};

// Inicjalizacja (sprawdza czy apka już nie istnieje, żeby uniknąć błędów przy odświeżaniu)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// EKSPORTUJEMY auth i provider, aby App.tsx mógł ich użyć
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;