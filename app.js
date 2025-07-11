// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyBDuLLrHkMp8J3iyb183lDzSrNNIPallcQ",
  authDomain: "bloxvault-d1ff0.firebaseapp.com",
  projectId: "bloxvault-d1ff0",
  storageBucket: "bloxvault-d1ff0.firebasestorage.app",
  messagingSenderId: "365008891027",
  appId: "1:365008891027:web:3578577b3c33714f207166",
  measurementId: "G-M3D3KVD5H5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI elements
const authDiv = document.getElementById("auth");
const dashDiv = document.getElementById("dashboard");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const userEmailSpan = document.getElementById("userEmail");
const pointsSpan = document.getElementById("points");

window.login = function () {
  signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .catch(alert);
};

window.register = function () {
  createUserWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .then(async (cred) => {
      await setDoc(doc(db, "users", cred.user.uid), { points: 0 });
    })
    .catch(alert);
};

window.logout = function () {
  signOut(auth);
};

window.requestReward = async function () {
  const uid = auth.currentUser.uid;
  const rewardType = document.getElementById("rewardType").value;
  const rewardDetails = document.getElementById("rewardDetails").value;
  const docRef = doc(db, "rewards", `${uid}-${Date.now()}`);
  await setDoc(docRef, {
    uid,
    rewardType,
    rewardDetails,
    status: "pending",
    timestamp: new Date()
  });
  alert("Reward request submitted!");
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    authDiv.style.display = "none";
    dashDiv.style.display = "block";
    userEmailSpan.textContent = user.email;
    const snap = await getDoc(doc(db, "users", user.uid));
    pointsSpan.textContent = snap.exists() ? snap.data().points : 0;
  } else {
    authDiv.style.display = "block";
    dashDiv.style.display = "none";
  }
});
