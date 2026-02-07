import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { categoryId } = body as { categoryId: string | null };
  const tx = await prisma.transaction.findFirst({
    where: {
      id,
      linkedAccount: { userId: session.user.id },
    },
  });
  if (!tx) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      categoryId: categoryId || null,
      categoryOverride: true,
    },
    include: { category: true },
  });
  return NextResponse.json(updated);
}
