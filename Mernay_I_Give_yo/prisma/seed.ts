import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Groceries", slug: "groceries", type: "expense" },
  { name: "Dining", slug: "dining", type: "expense" },
  { name: "Transport", slug: "transport", type: "expense" },
  { name: "Bills & Utilities", slug: "bills-utilities", type: "expense" },
  { name: "Shopping", slug: "shopping", type: "expense" },
  { name: "Entertainment", slug: "entertainment", type: "expense" },
  { name: "Health", slug: "health", type: "expense" },
  { name: "Travel", slug: "travel", type: "expense" },
  { name: "Personal", slug: "personal", type: "expense" },
  { name: "Income", slug: "income", type: "income" },
  { name: "Transfer", slug: "transfer", type: "expense" },
  { name: "Uncategorized", slug: "uncategorized", type: "expense" },
];

async function main() {
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {},
    });
  }
  console.log("Seeded default categories.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
