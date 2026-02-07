"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Budget, Category } from "@prisma/client";

type BudgetWithCategory = Budget & { category: Category };

export function BudgetsList({
  budgets,
  categories,
  spendingByCategory,
}: {
  budgets: BudgetWithCategory[];
  categories: Category[];
  spendingByCategory: Record<string, number>;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");

  async function addBudget(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!categoryId || isNaN(num) || num <= 0) return;
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        amount: num,
        period,
      }),
    });
    setAdding(false);
    setCategoryId("");
    setAmount("");
    setPeriod("monthly");
    router.refresh();
  }

  async function removeBudget(id: string) {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id)
  );

  return (
    <div className="space-y-4">
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          Add budget
        </button>
      ) : (
        <form onSubmit={addBudget} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            >
              <option value="">Select category</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="500"
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200 w-28"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "monthly" | "weekly")}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setCategoryId(""); setAmount(""); }}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {budgets.length === 0 && !adding ? (
        <p className="text-zinc-500">No budgets set. Add one to track spending by category.</p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const spent = spendingByCategory[b.categoryId] ?? 0;
            const limit = b.amount;
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const over = spent > limit;
            return (
              <li
                key={b.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{b.category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">
                      ${spent.toFixed(2)} / ${limit.toFixed(2)} ({b.period})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBudget(b.id)}
                      className="text-zinc-500 hover:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
