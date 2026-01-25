-- CreateTable
CREATE TABLE "achievement" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "achievement_child_id_idx" ON "achievement"("child_id");

-- AddForeignKey
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
