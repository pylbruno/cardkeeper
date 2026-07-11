import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcJHTYrzdK4AF5dsWkekYFJYHgqMb-dB0",
  authDomain: "cardkeeper-56c33.firebaseapp.com",
  projectId: "cardkeeper-56c33",
  storageBucket: "cardkeeper-56c33.firebasestorage.app",
  messagingSenderId: "147167201819",
  appId: "1:147167201819:web:0e04700a4deb3a1419c6be",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
