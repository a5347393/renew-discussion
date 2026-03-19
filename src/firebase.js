import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHkyOLfXUX7ybtNsIbw3L85osroWccqT4",
  authDomain: "renew-app-71533.firebaseapp.com",
  projectId: "renew-app-71533",
  storageBucket: "renew-app-71533.firebasestorage.app",
  messagingSenderId: "773485996764",
  appId: "1:773485996764:web:98b034d9b1883839d3e219",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
