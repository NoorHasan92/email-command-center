// server/repositories/db.ts
// Prisma client instance with encryption extensions.

import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "@/services/security/encryption";
import "server-only";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      account: {
        async create({ args, query }) {
          if (args.data.access_token) {
            args.data.access_token = encrypt(args.data.access_token) || undefined;
          }
          if (args.data.refresh_token) {
            args.data.refresh_token = encrypt(args.data.refresh_token) || undefined;
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.access_token && typeof args.data.access_token === "string") {
            args.data.access_token = encrypt(args.data.access_token) || undefined;
          }
          if (args.data.refresh_token && typeof args.data.refresh_token === "string") {
            args.data.refresh_token = encrypt(args.data.refresh_token) || undefined;
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (args.create.access_token) {
            args.create.access_token = encrypt(args.create.access_token as string) || undefined;
          }
          if (args.create.refresh_token) {
            args.create.refresh_token = encrypt(args.create.refresh_token as string) || undefined;
          }
          if (args.update.access_token && typeof args.update.access_token === "string") {
            args.update.access_token = encrypt(args.update.access_token) || undefined;
          }
          if (args.update.refresh_token && typeof args.update.refresh_token === "string") {
            args.update.refresh_token = encrypt(args.update.refresh_token) || undefined;
          }
          return query(args);
        },
        async createMany({ args, query }) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({
              ...item,
              access_token: item.access_token ? encrypt(item.access_token) || undefined : item.access_token,
              refresh_token: item.refresh_token ? encrypt(item.refresh_token) || undefined : item.refresh_token,
            }));
          } else if (args.data) {
            if (args.data.access_token) args.data.access_token = encrypt(args.data.access_token) || undefined;
            if (args.data.refresh_token) args.data.refresh_token = encrypt(args.data.refresh_token) || undefined;
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data.access_token && typeof args.data.access_token === "string") {
            args.data.access_token = encrypt(args.data.access_token) || undefined;
          }
          if (args.data.refresh_token && typeof args.data.refresh_token === "string") {
            args.data.refresh_token = encrypt(args.data.refresh_token) || undefined;
          }
          return query(args);
        },
      },
    },
    result: {
      account: {
        access_token: {
          needs: { access_token: true },
          compute(account) {
            return account.access_token ? decrypt(account.access_token) : null;
          },
        },
        refresh_token: {
          needs: { refresh_token: true },
          compute(account) {
            return account.refresh_token ? decrypt(account.refresh_token) : null;
          },
        },
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
