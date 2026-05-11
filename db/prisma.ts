import { PrismaClient } from "@/lib/generated/prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

// Decimal columns stay as Prisma's `runtime.Decimal` here — server actions
// use the `mapXxx` helpers in `lib/utils.ts` to convert them to plain strings
// at the RSC boundary.
export const prisma = new PrismaClient({ adapter });
