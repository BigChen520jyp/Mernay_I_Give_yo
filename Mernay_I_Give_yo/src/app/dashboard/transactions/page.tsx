import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncTransactionsButton } from "@/components/dashboard/SyncTransactionsButton";
import { TransactionList } from "@/components/dashboard/TransactionList";

const PAGE_SIZE = 20;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [transactions, total, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { linkedAccount: { userId: session.user.id } },
      include: {
        category: true,
        linkedAccount: { select: { accountName: true, institutionName: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.transaction.count({
      where: { linkedAccount: { userId: session.user.id } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <a
            href="/api/transactions/export"
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Export CSV
          </a>
          <SyncTransactionsButton />
        </div>
      </div>

      <ManualAndImport categories={categories} />

      <TransactionList
        transactions={transactions}
        categories={categories}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
