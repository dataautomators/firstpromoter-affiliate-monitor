-- CreateEnum
CREATE TYPE "PromoterStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "companyHost" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "schedule" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoterData" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "unpaid" INTEGER NOT NULL DEFAULT 0,
    "referral" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "customers" INTEGER NOT NULL DEFAULT 0,
    "status" "PromoterStatus" NOT NULL DEFAULT 'SUCCESS',
    "failedMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoterData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromoterData" ADD CONSTRAINT "PromoterData_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
