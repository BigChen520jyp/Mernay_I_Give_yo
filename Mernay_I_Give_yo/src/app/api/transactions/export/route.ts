import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toParam ? new Date(toParam) : new Date();

  const transactions = await prisma.transaction.findMany({
    where: {
      linkedAccount: { userId: session.user.id },
      date: { gte: from, lte: to },
    },
    include: { category: true, linkedAccount: { select: { accountName: true, institutionName: true } } },
    orderBy: { date: "asc" },
  });

  const headers = ["Date", "Name", "Merchant", "Account", "Category", "Amount", "Currency"];
  const rows = transactions.map((tx) => [
    new Date(tx.date).toISOString().slice(0, 10),
    tx.name,
    tx.merchantName ?? "",
    tx.linkedAccount.accountName ?? tx.linkedAccount.institutionName ?? "",
    tx.category?.name ?? "",
    tx.amount,
    tx.currency,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
