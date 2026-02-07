"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";

export function ManualAndImport({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [showManual, setShowManual] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!name || amount === "") return;
    setLoading(true);
    try {
      await fetch("/api/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          name,
          amount: parseFloat(amount),
          categoryId: categoryId || undefined,
        }),
      });
      setShowManual(false);
      setName("");
      setAmount("");
      setCategoryId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/transactions/import-csv", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult({ imported: data.imported, errors: data.errors ?? [] });
      router.refresh();
    } catch (err) {
      setImportResult({ imported: 0, errors: [String(err)] });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          {showManual ? "Cancel" : "Add manual transaction"}
        </button>
        <label className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer">
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={importCsv}
            disabled={loading}
          />
        </label>
      </div>
      {importResult && (
        <p className="text-sm text-zinc-400">
          Imported {importResult.imported} transaction(s).
          {importResult.errors.length > 0 && ` ${importResult.errors.length} row(s) skipped.`}
        </p>
      )}
      {showManual && (
        <form onSubmit={submitManual} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Description"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200 min-w-[180px]"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200 w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            >
              <option value="">Auto</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
