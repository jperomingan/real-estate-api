-- CreateEnum
CREATE TYPE "LeadFollowUpStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadFollowUpPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "lead_follow_up_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LeadFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LeadFollowUpPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "leadId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_follow_up_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_leadId_idx" ON "lead_follow_up_tasks"("leadId");

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_assignedToUserId_idx" ON "lead_follow_up_tasks"("assignedToUserId");

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_createdByUserId_idx" ON "lead_follow_up_tasks"("createdByUserId");

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_status_idx" ON "lead_follow_up_tasks"("status");

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_priority_idx" ON "lead_follow_up_tasks"("priority");

-- CreateIndex
CREATE INDEX "lead_follow_up_tasks_dueDate_idx" ON "lead_follow_up_tasks"("dueDate");

-- AddForeignKey
ALTER TABLE "lead_follow_up_tasks" ADD CONSTRAINT "lead_follow_up_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_up_tasks" ADD CONSTRAINT "lead_follow_up_tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_up_tasks" ADD CONSTRAINT "lead_follow_up_tasks_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
