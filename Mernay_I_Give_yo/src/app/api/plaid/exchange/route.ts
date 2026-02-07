import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bankProvider } from "@/lib/bank-provider";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { publicToken, accountIds } = body as { publicToken: string; accountIds?: string[] };
  if (!publicToken) {
    return NextResponse.json({ error: "Missing publicToken" }, { status: 400 });
  }
  const result = await bankProvider.exchangePublicToken(publicToken);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { itemId, accessToken, accounts } = result;
  const toLink = accountIds?.length
    ? accounts.filter((a) => accountIds.includes(a.id))
    : accounts;
  for (const acc of toLink) {
    await prisma.linkedAccount.create({
      data: {
        userId: session.user.id,
        provider: bankProvider.name,
        providerItemId: itemId,
        accessToken,
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.type,
        accountSubtype: acc.subtype,
      },
    });
  }
  return NextResponse.json({ ok: true, linked: toLink.length });
}
