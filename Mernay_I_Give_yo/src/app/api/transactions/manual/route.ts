import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { categorizeTransaction } from "@/lib/categorize";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { date, name, amount, categoryId } = body as {
    date: string;
    name: string;
    amount: number;
    categoryId?: string | null;
  };
  if (!date || !name || amount == null) {
    return NextResponse.json(
      { error: "date, name, and amount are required" },
      { status: 400 }
    );
  }

  let manualAccount = await prisma.linkedAccount.findFirst({
    where: { userId: session.user.id, provider: "manual" },
  });
  if (!manualAccount) {
    manualAccount = await prisma.linkedAccount.create({
      data: {
        userId: session.user.id,
        provider: "manual",
        accessToken: "manual",
        institutionName: "Manual entries",
        accountName: "Manual",
      },
    });
  }

  const category =
    categoryId ||
    (await categorizeTransaction(session.user.id, null, name, amount));
  const providerTxId = `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const tx = await prisma.transaction.create({
    data: {
      linkedAccountId: manualAccount.id,
      providerTxId,
      date: new Date(date),
      name,
      amount: Number(amount),
      currency: "CAD",
      categoryId: category || null,
      categoryOverride: Boolean(categoryId),
    },
    include: { category: true },
  });
  return NextResponse.json(tx);
}
