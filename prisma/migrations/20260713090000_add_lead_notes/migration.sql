CREATE TYPE "LeadNoteType" AS ENUM (
  'GENERAL',
  'CALL',
  'EMAIL',
  'SMS',
  'MEETING',
  'VIEWING',
  'FOLLOW_UP',
  'STATUS_UPDATE'
);

CREATE TABLE "lead_notes" (
  "id" TEXT NOT NULL,
  "type" "LeadNoteType" NOT NULL DEFAULT 'GENERAL',
  "content" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_notes_leadId_idx" ON "lead_notes"("leadId");
CREATE INDEX "lead_notes_createdByUserId_idx" ON "lead_notes"("createdByUserId");
CREATE INDEX "lead_notes_type_idx" ON "lead_notes"("type");
CREATE INDEX "lead_notes_createdAt_idx" ON "lead_notes"("createdAt");

ALTER TABLE "lead_notes"
ADD CONSTRAINT "lead_notes_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "leads"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_notes"
ADD CONSTRAINT "lead_notes_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
