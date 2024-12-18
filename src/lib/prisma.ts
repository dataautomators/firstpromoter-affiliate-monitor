// ts-ignore 7017 is used to ignore the error that the global object is not
// defined in the global scope. This is because the global object is only
// defined in the global scope in Node.js and not in the browser.

import { Prisma, PrismaClient } from "@prisma/client";
import { encrypt } from "./cryptoHelpers";
// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const myExtension = Prisma.defineExtension({
  name: "Encrypt Credentials", // Optional: name appears in error logs
  query: {
    promoter: {
      create: async ({ args, query }) => {
        const encryptedPassword = encrypt(args.data.password);
        args.data.password = encryptedPassword;
        return query(args);
      },
      update: async ({ args, query }) => {
        if (args.data.password) {
          const encryptedPassword = encrypt(args.data.password as string);
          args.data.password = encryptedPassword;
        }
        return query(args);
      },
      upsert: async ({ args, query }) => {
        if (args.create.password || args.update.password) {
          const encryptedPassword = encrypt(args.create.password as string);
          args.create.password = encryptedPassword;
        }
        if (args.update.password) {
          const encryptedPassword = encrypt(args.update.password as string);
          args.update.password = encryptedPassword;
        }
        return query(args);
      },
    },
  },
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient().$extends(myExtension);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
