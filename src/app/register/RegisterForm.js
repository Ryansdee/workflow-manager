// app/register/RegisterForm.js
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const inviteToken = searchParams.get("invite");
  const workflowId = searchParams.get("workflowId");
  const role = searchParams.get("role");

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        createdAt: new Date(),
      });

      if (inviteToken) {
        const inviteRef = doc(db, "invites", inviteToken);
        const inviteSnap = await getDoc(inviteRef);

        if (inviteSnap.exists()) {
          const { workflowId: wfId, role: inviteRole } = inviteSnap.data();
          const workflowRef = doc(db, "workflows", wfId);
          await updateDoc(workflowRef, {
            members: arrayUnion({
              uid: userCredential.user.uid,
              email,
              name,
              role: inviteRole,
              addedAt: Date.now(),
            }),
          });

          await deleteDoc(inviteRef);
          router.push(`/dashboard/${wfId}`);
          return;
        }
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Créer un compte</h1>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Création..." : "S’inscrire"}
        </button>
      </div>
    </div>
  );
}
