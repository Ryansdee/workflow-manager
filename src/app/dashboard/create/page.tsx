"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Zap, ArrowLeft, FolderKanban, Loader2 } from "lucide-react";

export default function CreateWorkflowPage() {
  const [user]    = useAuthState(auth);
  const router    = useRouter();

  const [projectName, setProjectName] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!projectName.trim()) { setError("Le nom du projet est requis"); return; }

    setLoading(true);
    setError("");

    try {
      const docRef = await addDoc(collection(db, "workflows"), {
        name:      projectName.trim(),
        ownerId:   user.uid,
        // memberIds : array plat de UIDs — requis pour les règles Firestore
        memberIds: [user.uid],
        members:   [{ uid: user.uid, role: "owner" }],
        createdAt: serverTimestamp(),
      });

      router.push(`/dashboard/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la création du projet. Vérifiez vos permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Bricolage+Grotesque:wght@400;500;600;700&display=swap');

        .create-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #F7F7F8;
          display: flex;
          flex-direction: column;
        }

        .fade-up {
          animation: fadeUp 0.5s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation-delay: .06s; }
        .stagger-2 { animation-delay: .12s; }
        .stagger-3 { animation-delay: .18s; }

        .card {
          background: #fff;
          border: 1px solid #EBEBEC;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,.06);
          padding: 40px;
          width: 100%;
          max-width: 460px;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #EBEBEC;
          border-radius: 10px;
          font-size: 14px;
          color: #111;
          background: #fff;
          transition: border-color .15s, box-shadow .15s;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .input-field:focus {
          border-color: #4F46E5;
          box-shadow: 0 0 0 3px rgba(79,70,229,.08);
        }
        .input-field::placeholder { color: #C0C0C4; }
        .input-field.has-error { border-color: #F87171; }

        .btn-primary {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 20px;
          background: #4F46E5; color: #fff;
          border-radius: 11px; font-size: 15px; font-weight: 600;
          border: none; cursor: pointer;
          transition: background .15s, box-shadow .15s, transform .15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary:hover:not(:disabled) {
          background: #4338CA;
          box-shadow: 0 6px 18px rgba(79,70,229,.35);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) { transform: scale(.98); }
        .btn-primary:disabled { opacity: .7; cursor: not-allowed; }

        .btn-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: #888; background: none; border: none;
          cursor: pointer; padding: 0;
          transition: color .15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-back:hover { color: #4F46E5; }

        .error-box {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px;
          background: #FEF2F2; border: 1px solid #FECACA; border-radius: 9px;
          font-size: 13px; color: #DC2626;
        }
      `}</style>

      <div className="create-root">

        {/* ── NAV ── */}
        <header style={{ background: "#fff", borderBottom: "1px solid #EBEBEC" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap style={{ width: 14, height: 14, color: "#fff" }} />
              </div>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15, color: "#1a1a1a", letterSpacing: "-0.2px" }}>
                Workflow
              </span>
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div className="card fade-up">

            {/* Icon */}
            <div className="fade-up stagger-1" style={{ width: 56, height: 56, background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <FolderKanban style={{ width: 26, height: 26, color: "#4F46E5" }} />
            </div>

            {/* Title */}
            <div className="fade-up stagger-1" style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 26, fontWeight: 700, color: "#111", letterSpacing: "-0.4px", marginBottom: 8 }}>
                Nouveau projet
              </h1>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.5 }}>
                Donnez un nom à votre projet pour démarrer.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate}>
              <div className="fade-up stagger-2" style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8, letterSpacing: "0.01em" }}>
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => { setProjectName(e.target.value); setError(""); }}
                  placeholder="Ex : Application CRM, Dashboard interne..."
                  className={`input-field ${error ? "has-error" : ""}`}
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="error-box fade-up" style={{ marginBottom: 16 }}>
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="fade-up stagger-3" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Création...</>
                    : "Créer le projet →"
                  }
                </button>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button type="button" className="btn-back" onClick={() => router.push("/dashboard")}>
                    <ArrowLeft style={{ width: 13, height: 13 }} />
                    Retour au tableau de bord
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}