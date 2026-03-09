"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

export function useUserPlan() {
  const [user] = useAuthState(auth);
  const [plan, setPlan] = useState<"free" | "starter" | "pro" | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setLoadingPlan(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const userRef = doc(db, "users", user.uid); // ✅ chemin correct pour éviter l'erreur permissions
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setPlan(data.plan || "free");
        } else {
          console.warn("Document utilisateur introuvable, plan par défaut = free");
          setPlan("free");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du plan :", error);
        setPlan("free"); // fallback
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [user]);

  return { plan, loadingPlan, user };
}
