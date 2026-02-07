"use client";

import { useRouter } from "next/navigation";
import type { Transaction, Category, LinkedAccount } from "@prisma/client";

type TxWithRelations = Transaction & {
  category: Category | null;
  linkedAccount: Pick<LinkedAccount, "accountName" | "institutionName">;
};

export function TransactionList({
  transactions,
  categories,
  page,
  totalPages,
  total,
}: {
  transactions: TxWithRelations[];
  categories: Category[];
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();

  async function updateCategory(txId: string, categoryId: string | null) {
    await fetch(`/api/transactions/${txId}/category`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
        No transactions yet. Link an account and click &quot;Sync transactions&quot;.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-left text-zinc-500">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Account</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30">
                <td className="p-3 text-zinc-400">
                  {new Date(tx.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-3">
                  <span className="font-medium">{tx.merchantName ?? tx.name}</span>
                </td>
                <td className="p-3 text-zinc-500">
                  {tx.linkedAccount.accountName ?? tx.linkedAccount.institutionName ?? "—"}
                </td>
                <td className="p-3">
                  <select
                    value={tx.categoryId ?? ""}
                    onChange={(e) =>
                      updateCategory(tx.id, e.target.value ? e.target.value : null)
                    }
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className={`p-3 text-right font-mono ${
                    tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  ${tx.amount.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/dashboard/transactions?page=${page - 1}`}
                className="text-emerald-500 hover:underline"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/dashboard/transactions?page=${page + 1}`}
                className="text-emerald-500 hover:underline"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
