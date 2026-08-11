-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "coverId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "draftContent" JSONB NOT NULL DEFAULT '{"sections":[]}',
    "publishedContent" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "draftVersion" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE INDEX "Resource_publishedAt_isFeatured_position_idx" ON "Resource"("publishedAt", "isFeatured", "position");

-- Row Level Security for the new table, matching 20260806120100_rls_deny_all.
--
-- Enabled and permissive to no one (ADR-006). A new application table that
-- skips this is exactly how a leaked anon key turns into a data exposure, so
-- the lockdown ships in the same migration as the table itself.
--
-- ENABLE only, never FORCE: Prisma connects as the table owner, and FORCE
-- would apply these (non-existent) policies to the owner too, locking the
-- application out of its own table.
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Resource" FROM anon, authenticated;
