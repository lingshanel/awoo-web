ALTER TYPE "AdminActionType" ADD VALUE 'CREATE_BAN';
ALTER TYPE "AdminActionType" ADD VALUE 'REVOKE_BAN';
ALTER TYPE "AdminActionType" ADD VALUE 'CHANGE_PASSWORD';
ALTER TYPE "AdminActionType" ADD VALUE 'AUTO_HIDE';

CREATE TYPE "AdminBanType" AS ENUM ('AUTHOR_HASH', 'IP_HASH');

CREATE TABLE "AdminBan" (
    "id" SERIAL NOT NULL,
    "banType" "AdminBanType" NOT NULL,
    "valueHash" VARCHAR(128) NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "createdById" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminBan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminBan_banType_valueHash_idx" ON "AdminBan"("banType", "valueHash");
CREATE INDEX "AdminBan_createdById_idx" ON "AdminBan"("createdById");

ALTER TABLE "AdminBan" ADD CONSTRAINT "AdminBan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
