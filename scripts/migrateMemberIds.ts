import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Utilise ton serviceAccount JSON
initializeApp({ credential: cert(require("./serviceAccount.json")) });

const db = getFirestore();

async function migrate() {
  const snap = await db.collection("workflows").get();

  const batch = db.batch();
  snap.forEach((doc) => {
    const data = doc.data();
    const memberIds: string[] = (data.members ?? []).map((m: any) => m.uid);
    batch.update(doc.ref, { memberIds });
  });

  await batch.commit();
  console.log(`✅ ${snap.size} workflows migrés`);
}

migrate();