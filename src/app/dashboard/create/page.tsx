"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export default function CreateWorkflowPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!projectName.trim()) {
      setError("Le nom du projet est requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const docRef = await addDoc(collection(db, "workflows"), {
        name: projectName.trim(),
        ownerId: user.uid,
        members: [{ uid: user.uid, role: "owner" }],
        createdAt: serverTimestamp(),
      });

      router.push(`/dashboard/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la création du workflow.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleCreate}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Nouveau projet 🛠️
        </h1>

        <label className="block text-gray-700 font-medium mb-2">
          Nom du projet
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Ex: Application CRM, Dashboard interne..."
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
          required
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Création..." : "Créer le workflow"}
        </button>
      </form>
    </main>
  );
}
