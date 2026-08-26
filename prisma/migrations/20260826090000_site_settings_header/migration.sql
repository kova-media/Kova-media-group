-- The header's call-to-action label and target, so the one button that appears
-- on every page can be renamed or repointed without a deploy.
-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "header" JSONB NOT NULL DEFAULT '{}';
