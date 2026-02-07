import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetsList } from "@/components/dashboard/BudgetsList";

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [budgets, categories, spendingThisMonth] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { type: "expense" },
      orderBy: { name: "asc" },
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

  const spendingByCategory = Object.fromEntries(
    spendingThisMonth.map((s) => [s.categoryId ?? "", Math.abs(s._sum.amount ?? 0)])
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Budgets</h1>
      <BudgetsList
        budgets={budgets}
        categories={categories}
        spendingByCategory={spendingByCategory}
      />
    </div>
  );
}
