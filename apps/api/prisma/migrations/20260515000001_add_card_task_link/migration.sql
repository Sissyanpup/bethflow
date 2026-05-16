-- AddColumn Card.taskId
ALTER TABLE "Card" ADD COLUMN "taskId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Card_taskId_key" ON "Card"("taskId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
