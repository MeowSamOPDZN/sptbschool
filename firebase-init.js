/* SPTB. — Firebase Auth + Firestore (module, loaded on every page) */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, where, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase web config — public by design (identifiers, not secrets).
// Real security comes from Firestore rules (see firestore.rules).
const firebaseConfig = {
  apiKey: "AIzaSyD08WBQ9C8Tlq6ItdAEydjlTij7XHO345o",
  authDomain: "notfelixx-b7d92.firebaseapp.com",
  projectId: "notfelixx-b7d92",
  storageBucket: "notfelixx-b7d92.firebasestorage.app",
  messagingSenderId: "727013905433",
  appId: "1:727013905433:web:7b55f69af54f43eaef0688",
  measurementId: "G-WBH0GL2KN1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export {
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
  collection, addDoc, serverTimestamp, query, where, orderBy, getDocs
};

function setNav(user) {
  var a = document.getElementById("nav-auth");
  if (a) {
    a.textContent = user ? "Account" : "Sign in";
    a.href = user ? "/account" : "/signin";
  }
  var d = document.getElementById("drawer-auth");
  if (d) {
    d.textContent = user ? "Account" : "Sign in";
    d.href = user ? "/account" : "/signin";
  }
}

onAuthStateChanged(auth, function (user) {
  window.SPTB_USER = user || null;
  setNav(user);
  document.dispatchEvent(new CustomEvent("sptb-auth", { detail: user || null }));
});
setNav(auth.currentUser);
