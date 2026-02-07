import { prisma } from "./prisma";

/**
 * Assign a category to a transaction based on user rules and default keyword rules.
 * Returns categoryId or null for uncategorized.
 */
export async function categorizeTransaction(
  userId: string,
  merchantName: string | null,
  name: string,
  amount: number
): Promise<string | null> {
  const searchText = [merchantName, name].filter(Boolean).join(" ").toUpperCase();
  if (!searchText) return null;

  // User-defined rules (priority order)
  const rules = await prisma.categoryRule.findMany({
    where: { userId },
    orderBy: { priority: "desc" },
    include: { category: true },
  });
  for (const rule of rules) {
    const match =
      rule.matchType === "equals"
        ? searchText === rule.matchValue.toUpperCase()
        : rule.matchType === "startsWith"
          ? searchText.startsWith(rule.matchValue.toUpperCase())
          : searchText.includes(rule.matchValue.toUpperCase());
    if (match) return rule.categoryId;
  }

  // Default keyword rules (expense categories)
  const defaultKeywords: Record<string, string[]> = {
    groceries: ["SUPERSTORE", "WALMART", "COSTCO", "SAFEWAY", "LOBLAWS", "METRO", "GROCERY", "FOOD BASICS"],
    dining: ["RESTAURANT", "UBER EATS", "DOORDASH", "STARBUCKS", "TIM HORTONS", "MCDONALD", "CAFE"],
    transport: ["UBER", "LYFT", "PETRO", "SHELL", "ESSO", "GAS", "TRANSIT", "TTC", "PARKING"],
    "bills-utilities": ["HYDRO", "ENBRIDGE", "ROGERS", "BELL", "TELUS", "INSURANCE", "RENT"],
    entertainment: ["NETFLIX", "SPOTIFY", "APPLE.COM/BILL", "AMAZON", "STEAM", "CINE"],
    health: ["PHARMACY", "SHOPPERS", "REXALL", "CLINIC", "DENTAL"],
    travel: ["AIRLINE", "HOTEL", "EXPEDIA", "BOOKING"],
  };
  const categoriesBySlug = await prisma.category.findMany({
    where: { slug: { in: Object.keys(defaultKeywords) } },
  });
  const slugToId = Object.fromEntries(categoriesBySlug.map((c) => [c.slug, c.id]));
  for (const [slug, keywords] of Object.entries(defaultKeywords)) {
    if (keywords.some((k) => searchText.includes(k))) return slugToId[slug] ?? null;
  }

  // Income: positive amount often indicates income or transfer
  if (amount > 0) {
    const incomeCat = await prisma.category.findUnique({
      where: { slug: "income" },
    });
    return incomeCat?.id ?? null;
  }

  return null;
}
