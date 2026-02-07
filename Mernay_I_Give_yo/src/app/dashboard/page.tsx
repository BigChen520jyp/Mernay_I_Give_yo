import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [linkedCount, txCount, spendingByCategory] = await Promise.all([
    prisma.linkedAccount.count({ where: { userId: session.user.id } }),
    prisma.transaction.count({
      where: { linkedAccount: { userId: session.user.id } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        linkedAccount: { userId: session.user.id },
        amount: { lt: 0 },
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const categoryIds = [...new Set(spendingByCategory.map((s) => s.categoryId).filter(Boolean))];
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds as string[] } },
      })
    : [];
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const totalSpending = spendingByCategory.reduce((acc, s) => acc + (s._sum.amount ?? 0), 0);
  const incomeThisMonth = await prisma.transaction.aggregate({
    where: {
      linkedAccount: { userId: session.user.id },
      amount: { gt: 0 },
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    },
    _sum: { amount: true },
  });
  const income = incomeThisMonth._sum.amount ?? 0;
  const netFlow = income + totalSpending; // totalSpending is negative

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-medium text-zinc-500 mb-2">Income vs expenses (this month)</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-zinc-500">Income </span>
            <span className="font-semibold text-emerald-400">
              ${income.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Expenses </span>
            <span className="font-semibold text-red-400">
              ${Math.abs(totalSpending).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Net </span>
            <span className={`font-semibold ${netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${netFlow.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Linked accounts</p>
          <p className="text-2xl font-semibold">{linkedCount}</p>
          <Link href="/dashboard/accounts" className="text-sm text-emerald-500 hover:underline">
            Link account
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Transactions synced</p>
          <p className="text-2xl font-semibold">{txCount}</p>
          <Link href="/dashboard/transactions" className="text-sm text-emerald-500 hover:underline">
            View all
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Income this month</p>
          <p className="text-2xl font-semibold text-emerald-400">
            ${income.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium mb-4">Spending by category (this month)</h2>
        {totalSpending === 0 ? (
          <p className="text-zinc-500">No spending data yet. Link an account and sync transactions.</p>
        ) : (
          <div className="space-y-2">
            {spendingByCategory
              .filter((s) => s.categoryId)
              .sort((a, b) => (a._sum.amount ?? 0) - (b._sum.amount ?? 0))
              .map((s) => (
                <div key={s.categoryId} className="flex justify-between text-sm">
                  <span>{categoryMap[s.categoryId!] ?? "Uncategorized"}</span>
                  <span className="text-red-400">
                    ${Math.abs(s._sum.amount ?? 0).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            <div className="flex justify-between border-t border-zinc-700 pt-2 font-medium">
              <span>Total</span>
              <span className="text-red-400">
                ${Math.abs(totalSpending).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
