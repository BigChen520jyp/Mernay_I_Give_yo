"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type User = { id?: string; name?: string | null; email?: string | null };

export function DashboardNav({ user }: { user: User }) {
  return (
    <nav className="flex items-center gap-6">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard/accounts"
        className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        Accounts
      </Link>
      <Link
        href="/dashboard/transactions"
        className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        Transactions
      </Link>
      <Link
        href="/dashboard/budgets"
        className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        Budgets
      </Link>
      <span className="text-sm text-zinc-500">{user?.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Sign out
      </button>
    </nav>
  );
}
