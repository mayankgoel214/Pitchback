-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "state_history" JSONB NOT NULL DEFAULT '[]',
    "state" TEXT NOT NULL,
    "latencies" JSONB NOT NULL DEFAULT '[]',
    "completed_at" TIMESTAMP(3),
    "outcome" TEXT,
    "turns" INTEGER NOT NULL DEFAULT 0,
    "discovery" INTEGER,
    "talk_listen" INTEGER,
    "objection_handling" INTEGER,
    "next_step" INTEGER,
    "overall" INTEGER,
    "competencies" JSONB,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_windows" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_windows_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "speech_cache" (
    "key" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speech_cache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "runs_created_at_idx" ON "runs"("created_at");

-- CreateIndex
CREATE INDEX "runs_scenario_id_idx" ON "runs"("scenario_id");

-- CreateIndex
CREATE INDEX "runs_completed_at_idx" ON "runs"("completed_at");

-- CreateIndex
CREATE INDEX "rate_limit_windows_expires_at_idx" ON "rate_limit_windows"("expires_at");
