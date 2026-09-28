ALTER TABLE "StudentProfile" ADD COLUMN "rfidUid" TEXT;

CREATE UNIQUE INDEX "StudentProfile_rfidUid_key" ON "StudentProfile"("rfidUid");

UPDATE "StudentProfile" AS student
SET "rfidUid" = 'EA972406'
FROM "User" AS account
WHERE student."userId" = account."id"
	AND account."email" = 'anna@uni.demo';
