import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkAccountButton } from "@/components/dashboard/LinkAccountButton";

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const accounts = await prisma.linkedAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Linked accounts</h1>
        <LinkAccountButton />
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-500 mb-4">No accounts linked yet.</p>
          <p className="text-sm text-zinc-600 mb-6">
            Link your Canadian bank or credit card to sync transactions automatically.
          </p>
          <LinkAccountButton />
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((acc) => (
            <li
              key={acc.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{acc.accountName ?? acc.accountId}</p>
                <p className="text-sm text-zinc-500">
                  {acc.institutionName ?? acc.provider} · {acc.accountType ?? "account"}
                  {acc.accountSubtype ? ` (${acc.accountSubtype})` : ""}
                </p>
              </div>
              {acc.currentBalance != null && (
                <p className="font-mono text-zinc-300">
                  ${acc.currentBalance.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
