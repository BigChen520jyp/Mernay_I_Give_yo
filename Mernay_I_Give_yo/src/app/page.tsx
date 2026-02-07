import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <main className="max-w-lg text-center space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Mernay</h1>
        <p className="text-zinc-400">
          Track spending and income, link your Canadian bank and credit accounts, and see
          insightful dashboards—all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg border border-zinc-600 px-4 py-2 font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Sign up
          </Link>
        </div>
      </main>
    </div>
  );
}
