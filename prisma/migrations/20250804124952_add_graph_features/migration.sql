-- AlterTable
ALTER TABLE "public"."Note" ADD COLUMN     "x" DOUBLE PRECISION,
ADD COLUMN     "y" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."NoteLink" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteLink_fromId_toId_key" ON "public"."NoteLink"("fromId", "toId");

-- AddForeignKey
ALTER TABLE "public"."NoteLink" ADD CONSTRAINT "NoteLink_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoteLink" ADD CONSTRAINT "NoteLink_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
