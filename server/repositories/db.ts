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
