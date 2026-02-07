import { prisma } from "./prisma";
import { bankProvider } from "./bank-provider";
import { categorizeTransaction } from "./categorize";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function syncTransactionsForUser(userId: string): Promise<{ synced: number; errors: string[] }> {
  const linkedAccounts = await prisma.linkedAccount.findMany({
    where: { userId },
  });
  const errors: string[] = [];
  let synced = 0;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);

  for (const account of linkedAccounts) {
    if (account.provider !== "plaid") continue;
    const result = await bankProvider.getTransactions(
      account.accessToken,
      formatDate(start),
      formatDate(end)
    );
    if ("error" in result) {
      errors.push(`${account.accountName ?? account.id}: ${result.error}`);
      continue;
    }
    const transactions = result.transactions ?? [];
    for (const tx of transactions) {
      const amount = tx.amount ?? 0;
      const categoryId =
        tx.pending === true
          ? null
          : await categorizeTransaction(
              userId,
              tx.merchant_name ?? null,
              tx.name ?? "",
              amount
            );
      try {
        const existing = await prisma.transaction.findUnique({
          where: { providerTxId: tx.transaction_id },
        });
        const updateCategory = !existing?.categoryOverride;
        await prisma.transaction.upsert({
          where: { providerTxId: tx.transaction_id },
          create: {
            linkedAccountId: account.id,
            providerTxId: tx.transaction_id,
            date: new Date(tx.date),
            name: tx.name ?? "",
            merchantName: tx.merchant_name ?? null,
            amount,
            currency: tx.iso_currency_code ?? "CAD",
            categoryId,
            categoryOverride: false,
            pending: tx.pending ?? false,
          },
          update: {
            date: new Date(tx.date),
            name: tx.name ?? "",
            merchantName: tx.merchant_name ?? null,
            amount,
            pending: tx.pending ?? false,
            ...(updateCategory ? { categoryId } : {}),
          },
        });
        synced++;
      } catch (e) {
        errors.push(`Tx ${tx.transaction_id}: ${String(e)}`);
      }
    }
  }

  return { synced, errors };
}
