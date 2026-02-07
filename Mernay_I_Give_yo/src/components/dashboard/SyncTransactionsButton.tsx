"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncTransactionsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Sync failed. Check that accounts are linked and Plaid is configured.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {loading ? "Syncing…" : "Sync transactions"}
    </button>
  );
}
