import "dotenv/config";

import sampleData from "./sample-data";
import { prisma } from "./prisma";

async function main() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: sampleData.products });
  console.log("Database seeded successfully");
}

main();
