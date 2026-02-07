import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(budgets);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { categoryId, amount, period, startDate, endDate } = body as {
    categoryId: string;
    amount: number;
    period: string;
    startDate?: string;
    endDate?: string;
  };
  if (!categoryId || amount == null || !period) {
    return NextResponse.json(
      { error: "categoryId, amount, and period are required" },
      { status: 400 }
    );
  }
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : null;
  const budget = await prisma.budget.create({
    data: {
      userId: session.user.id,
      categoryId,
      amount,
      period: period === "weekly" ? "weekly" : "monthly",
      startDate: start,
      endDate: end,
    },
    include: { category: true },
  });
  return NextResponse.json(budget);
}
