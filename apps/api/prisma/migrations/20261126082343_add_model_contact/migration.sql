-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "userAccountId" INTEGER NOT NULL,
    "contactAccountId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_userAccountId_contactAccountId_key" ON "contacts"("userAccountId", "contactAccountId");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contactAccountId_fkey" FOREIGN KEY ("contactAccountId") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
