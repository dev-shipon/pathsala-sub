import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCN5ZdPQqJm1QiKZ82_Ys_u3n6afk9Gg7c",
    authDomain: "talukdar-pathsala.firebaseapp.com",
    projectId: "talukdar-pathsala",
    storageBucket: "talukdar-pathsala.firebasestorage.app",
    messagingSenderId: "108485701084",
    appId: "1:108485701084:web:ecd24d07835f1a49297319"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
