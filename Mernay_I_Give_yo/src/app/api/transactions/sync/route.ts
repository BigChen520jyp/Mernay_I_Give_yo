import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncTransactionsForUser } from "@/lib/sync-transactions";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncTransactionsForUser(session.user.id);
  return NextResponse.json(result);
}
