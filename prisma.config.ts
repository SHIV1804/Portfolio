import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Generation does not connect to the database. Keep postinstall usable when
    // DATABASE_URL is absent; migrate commands require an explicit real URL.
    url: process.env.DATABASE_URL ?? "",
  },
});
