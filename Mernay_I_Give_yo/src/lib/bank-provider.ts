/**
 * Provider-agnostic bank linking and transaction sync.
 * Currently implements Plaid; can add Flinks or others behind the same interface.
 */

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const clientId = process.env.PLAID_CLIENT_ID;
const secret = process.env.PLAID_SECRET;
const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

function getPlaidClient(): PlaidApi | null {
  if (!clientId || !secret) return null;
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });
  return new PlaidApi(configuration);
}

export const bankProvider = {
  name: "plaid" as const,

  isConfigured(): boolean {
    return Boolean(clientId && secret);
  },

  async createLinkToken(userId: string): Promise<{ linkToken: string } | { error: string }> {
    const client = getPlaidClient();
    if (!client) return { error: "Bank linking is not configured" };
    try {
      const response = await client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: "Mernay",
        products: ["transactions"],
        country_codes: ["CA", "US"],
        language: "en",
      });
      return { linkToken: response.data.link_token };
    } catch (err) {
      console.error("Plaid linkTokenCreate error:", err);
      return { error: "Could not create link token" };
    }
  },

  async exchangePublicToken(publicToken: string): Promise<
    | { itemId: string; accessToken: string; accounts: Array<{ id: string; name: string; type: string; subtype: string | null }> }
    | { error: string }
  > {
    const client = getPlaidClient();
    if (!client) return { error: "Bank linking is not configured" };
    try {
      const response = await client.itemPublicTokenExchange({ public_token: publicToken });
      const itemId = response.data.item_id;
      const accessToken = response.data.access_token;
      const accounts = response.data.accounts.map((a) => ({
        id: a.account_id,
        name: a.name,
        type: a.type ?? "other",
        subtype: a.subtype ?? null,
      }));
      return { itemId, accessToken, accounts };
    } catch (err) {
      console.error("Plaid exchange error:", err);
      return { error: "Could not link account" };
    }
  },

  async getAccounts(accessToken: string) {
    const client = getPlaidClient();
    if (!client) return null;
    try {
      const response = await client.accountsGet({ access_token: accessToken });
      return response.data.accounts;
    } catch {
      return null;
    }
  },

  async getTransactions(accessToken: string, start: string, end: string) {
    const client = getPlaidClient();
    if (!client) return { error: "Not configured" };
    const all: Array<{
      transaction_id: string;
      date: string;
      name: string | null;
      merchant_name: string | null;
      amount: number;
      iso_currency_code?: string;
      pending?: boolean;
    }> = [];
    let offset = 0;
    const count = 500;
    try {
      while (true) {
        const response = await client.transactionsGet({
          access_token: accessToken,
          start_date: start,
          end_date: end,
          options: { offset, count },
        });
        const txns = response.data.transactions ?? [];
        all.push(...txns);
        if (txns.length < count) break;
        offset += count;
      }
      return { transactions: all };
    } catch (err) {
      console.error("Plaid transactionsGet error:", err);
      return { error: "Could not fetch transactions" };
    }
  },
};
