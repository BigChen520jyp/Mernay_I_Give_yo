import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeTransaction } from "@/lib/categorize";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        accountName: "Manual (CSV import)",
      },
    });
  }

  const body = await request.text();
  const lines = body.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have header row and at least one data row" },
      { status: 400 }
    );
  }

  function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        out.push(cur.replace(/^"|"$/g, "").trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur.replace(/^"|"$/g, "").trim());
    return out;
  }

  const headerRow = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  const col = (row: string[], name: string) => {
    const i = headerRow.indexOf(name);
    return i >= 0 ? row[i]?.trim() ?? "" : "";
  };

  const dateIdx = headerRow.findIndex((h) => h.includes("date"));
  const nameIdx = headerRow.findIndex((h) => h.includes("name") || h.includes("description") || h.includes("memo"));
  const amountIdx = headerRow.findIndex((h) => h.includes("amount") || h.includes("debit") || h.includes("credit"));
  if (dateIdx < 0 || nameIdx < 0 || amountIdx < 0) {
    return NextResponse.json(
      { error: "CSV must have date, name/description, and amount columns" },
      { status: 400 }
    );
  }

  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const date = row[dateIdx]?.trim() ?? "";
    const name = (row[nameIdx] ?? row[nameIdx + 1] ?? row[0])?.trim() ?? "";
    const amountStr = (row[amountIdx] ?? "").replace(/[,$]/g, "").trim();
    const amount = parseFloat(amountStr);
    if (!date || !name || isNaN(amount)) {
      errors.push(`Row: ${row.join(",").slice(0, 50)}...`);
      continue;
    }
    const category = await categorizeTransaction(session.user.id, null, name, amount);
    const providerTxId = `csv-${Date.now()}-${imported}-${Math.random().toString(36).slice(2)}`;
    try {
      await prisma.transaction.create({
        data: {
          linkedAccountId: manualAccount.id,
          providerTxId,
          date: new Date(date),
          name,
          amount,
          currency: "CAD",
          categoryId: category || null,
          categoryOverride: false,
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Row ${imported + 1}: ${String(e)}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
