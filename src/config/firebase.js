import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";

import {
  getFirestore,
  setDoc,
  doc,
  query
} from "firebase/firestore";

import { getStorage } from "firebase/storage";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyARns-gzenrSndUxo4nS63piHNdO47OEcU",
  authDomain: "chat-app-dk-21b82.firebaseapp.com",
  projectId: "chat-app-dk-21b82",

  // 🔥🔥🔥 THIS WAS THE BUG
  storageBucket: "chat-app-dk-21b82.appspot.com",

  messagingSenderId: "1041599303269",
  appId: "1:1041599303269:web:69a19c977f4bcbc18cc08c"
};

// ✅ INIT
const app = initializeApp(firebaseConfig);

// ✅ SERVICES
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* =========================
   SIGN UP
========================= */
const signup = async (username, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await updateProfile(user, { displayName: username });

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey, There I am using chat app",
      lastSeen: Date.now()
    });

    await setDoc(doc(db, "chats", user.uid), {
      chatsData: []
    });

    return user;
  } catch (error) {
    console.error("Signup error:", error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
    throw error;
  }
};

/* =========================
   LOGIN
========================= */
const login = async (email, password) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (error) {
    console.error("Login error:", error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
    throw error;
  }
};

/* =========================
   LOGOUT
========================= */
const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    toast.error(error.code.split("/")[1].split("-").join(" "));
    throw error;
  }
};


const resetPass = async (email) => {
  if (!email){
    toast.error("Enter your email");
    return null;
  }
  try {
       const userRef = collection(db,'users');
       const q = query(userRef, where("email", "==",email));
       const querySnap = await getDocs(q);
       if (!querySnap.empty) {
        await sendPasswordResetEmail(auth, email);
        toast.success("Reset Email Sent")
       }
       else{
        toast.error("Email does't exists")
       }
  }catch (error) {
    console.error(error);
    toast.error(error.message)

  }
}
export { app, auth, db, storage, signup, login, logout,resetPass };
