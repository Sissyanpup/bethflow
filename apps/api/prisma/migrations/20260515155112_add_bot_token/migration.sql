-- CreateTable
CREATE TABLE "BotToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "BotToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotToken_token_key" ON "BotToken"("token");

-- CreateIndex
CREATE INDEX "BotToken_userId_idx" ON "BotToken"("userId");

-- AddForeignKey
ALTER TABLE "BotToken" ADD CONSTRAINT "BotToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
