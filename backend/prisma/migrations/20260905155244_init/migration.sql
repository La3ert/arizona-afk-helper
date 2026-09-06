-- CreateTable
CREATE TABLE "User" (
    "sessionKey" TEXT NOT NULL,
    "chatForwarding" BOOLEAN NOT NULL DEFAULT true,
    "payDayStats" BOOLEAN NOT NULL DEFAULT true,
    "remoteControl" BOOLEAN NOT NULL DEFAULT false,
    "auto2FA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("sessionKey")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "server" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "curExp" INTEGER NOT NULL DEFAULT 0,
    "maxExp" INTEGER NOT NULL DEFAULT 0,
    "bankBalance" BIGINT NOT NULL DEFAULT 0,
    "depositBalance" BIGINT NOT NULL DEFAULT 0,
    "AZCoinsBalance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayDayEvent" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" INTEGER NOT NULL DEFAULT 0,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "dividends" INTEGER NOT NULL DEFAULT 0,
    "earnedAZCoins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PayDayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_accountId_server_key" ON "Player"("accountId", "server");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userKey_fkey" FOREIGN KEY ("userKey") REFERENCES "User"("sessionKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayDayEvent" ADD CONSTRAINT "PayDayEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
