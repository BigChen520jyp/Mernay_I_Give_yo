import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bankProvider } from "@/lib/bank-provider";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await bankProvider.createLinkToken(session.user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ linkToken: result.linkToken });
}
