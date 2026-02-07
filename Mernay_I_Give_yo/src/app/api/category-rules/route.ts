import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rules = await prisma.categoryRule.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: [{ priority: "desc" }, { matchValue: "asc" }],
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { categoryId, matchType, matchValue, priority } = body as {
    categoryId: string;
    matchType: string;
    matchValue: string;
    priority?: number;
  };
  if (!categoryId || !matchValue) {
    return NextResponse.json(
      { error: "categoryId and matchValue are required" },
      { status: 400 }
    );
  }
  const rule = await prisma.categoryRule.create({
    data: {
      userId: session.user.id,
      categoryId,
      matchType: matchType === "startsWith" ? "startsWith" : matchType === "equals" ? "equals" : "contains",
      matchValue: matchValue.trim(),
      priority: typeof priority === "number" ? priority : 0,
    },
    include: { category: true },
  });
  return NextResponse.json(rule);
}
