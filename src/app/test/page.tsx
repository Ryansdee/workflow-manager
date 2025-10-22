"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function TestPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "test"));
      setData(querySnapshot.docs.map((doc) => doc.data()));
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Firebase Test 🔥</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
