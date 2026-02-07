"use client";

import { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";

export function LinkAccountButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get link token");
      setLinkToken(data.linkToken);
    } catch (e) {
      console.error(e);
      alert("Could not start bank linking. Check that Plaid is configured (see .env.example).");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      try {
        const res = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to link account");
        setLinkToken(null);
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("Failed to save linked account.");
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  return (
    <button
      type="button"
      onClick={fetchLinkToken}
      disabled={loading}
      className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {loading ? "Loading…" : "Link account"}
    </button>
  );
}
