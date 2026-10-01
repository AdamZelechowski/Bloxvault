import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// This web config is public by design. What actually protects the data is firestore.rules.
const app = initializeApp({
  apiKey: "AIzaSyBDuLLrHkMp8J3iyb183lDzSrNNIPallcQ",
  authDomain: "bloxvault-d1ff0.firebaseapp.com",
  projectId: "bloxvault-d1ff0",
  appId: "1:365008891027:web:3578577b3c33714f207166",
});
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UID = "eu5yOu5JPIQ6qOzkGDapjMrgt522"; // only shows the Admin button; the rules enforce access
const VIEWS = ["auth", "dashboard", "admin"];
const ERRORS = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email address isn't valid.",
  "auth/email-already-in-use": "That email already has an account.",
  "auth/weak-password": "Choose a stronger password.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/unauthorized-domain": "This domain isn't in Firebase Authentication's authorized domains.",
};

const $ = (id) => document.getElementById(id);
const explain = (err) => ERRORS[err.code] || "Something went wrong. Try again.";
const cleanName = (s) => (s || "").replace(/[<>]/g, "").trim().slice(0, 30) || null;
const fmt = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString() : "—");

let unsubProfile = null;
let pendingName = null; // display name typed on the register form, used when the profile is created

function msg(id, text, kind = "danger") {
  const el = $(id);
  el.className = `alert alert-${kind} mt-3`;
  el.textContent = text;
  el.hidden = !text;
}

function showView(name) {
  VIEWS.forEach((v) => ($(v).hidden = v !== name));
}

function showTab(tab) {
  $("loginForm").hidden = tab !== "login";
  $("registerForm").hidden = tab !== "register";
  $("loginTab").classList.toggle("active", tab === "login");
  $("registerTab").classList.toggle("active", tab === "register");
  msg("authMsg", "");
}

// Creates the profile on first sign-in; otherwise refreshes lastLogin at most every 6 hours.
async function touchProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: pendingName || cleanName(user.displayName),
      provider: user.providerData[0]?.providerId === "google.com" ? "google" : "email",
      joinDate: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } else if (Date.now() - (snap.data().lastLogin?.toMillis?.() ?? 0) > 6 * 3600 * 1000) {
    await updateDoc(ref, { lastLogin: serverTimestamp() });
  }
  pendingName = null;
}

function renderProfile(data, user) {
  $("welcomeName").textContent = data?.displayName || "there";
  $("profileEmail").textContent = user.email;
  $("profileJoined").textContent = fmt(data?.joinDate);
  $("profileLast").textContent = fmt(data?.lastLogin);
  if (document.activeElement !== $("nameInput")) $("nameInput").value = data?.displayName || "";
}

async function loadUsers() {
  const rows = $("userRows");
  rows.replaceChildren();
  msg("adminMsg", "");
  try {
    const snap = await getDocs(collection(db, "users"));
    $("userCount").textContent = snap.size;
    snap.forEach((d) => {
      const u = d.data();
      const tr = document.createElement("tr");
      [u.email, u.displayName, u.provider, fmt(u.joinDate), fmt(u.lastLogin)].forEach((v) => {
        const td = document.createElement("td");
        td.textContent = v ?? "—"; // textContent, never innerHTML: user-controlled text stays inert
        tr.append(td);
      });
      rows.append(tr);
    });
  } catch {
    msg("adminMsg", "Couldn't load users. Check that you're signed in as the admin.");
  }
}

$("loginTab").addEventListener("click", () => showTab("login"));
$("registerTab").addEventListener("click", () => showTab("register"));

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg("authMsg", "");
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
  } catch (err) {
    msg("authMsg", explain(err));
  }
});

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg("authMsg", "");
  const password = $("regPassword").value;
  if (password.length < 8) return msg("authMsg", "Use at least 8 characters.");
  if (password !== $("regConfirm").value) return msg("authMsg", "The passwords don't match.");
  pendingName = cleanName($("regName").value);
  try {
    const cred = await createUserWithEmailAndPassword(auth, $("regEmail").value.trim(), password);
    sendEmailVerification(cred.user).catch(() => {});
  } catch (err) {
    pendingName = null;
    msg("authMsg", explain(err));
  }
});

$("googleBtn").addEventListener("click", async () => {
  msg("authMsg", "");
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    msg("authMsg", explain(err));
  }
});

$("forgotBtn").addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();
  if (!email) return msg("authMsg", "Type your email above, then click Forgot password.", "warning");
  try { await sendPasswordResetEmail(auth, email); } catch { /* same reply either way */ }
  msg("authMsg", "If an account exists for that email, a reset link is on its way.", "success");
});

$("nameForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { displayName: cleanName($("nameInput").value) });
    msg("profileMsg", "Name saved.", "success");
  } catch {
    msg("profileMsg", "Couldn't save the name. Try again.");
  }
});

$("userFilter").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  for (const tr of $("userRows").rows) tr.hidden = !tr.cells[0].textContent.toLowerCase().includes(q);
});

$("navHome").addEventListener("click", () => showView("dashboard"));
$("navAdmin").addEventListener("click", () => { showView("admin"); loadUsers(); });
$("navLogout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  unsubProfile?.();
  unsubProfile = null;
  $("loading").hidden = true;
  $("topNav").hidden = !user;
  if (!user) return showView("auth");

  $("navAdmin").hidden = user.uid !== ADMIN_UID;
  $("verifyNote").hidden = user.emailVerified;
  showView("dashboard");
  try {
    await touchProfile(user);
    unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => renderProfile(snap.data(), user));
  } catch (err) {
    console.error(err);
    msg("profileMsg", "Couldn't load your profile.");
  }
});
