-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_amount" DECIMAL(10,2) NOT NULL,
    "current_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalReward" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_child_id_idx" ON "Goal"("child_id");

-- CreateIndex
CREATE INDEX "GoalReward_goal_id_idx" ON "GoalReward"("goal_id");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalReward" ADD CONSTRAINT "GoalReward_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
