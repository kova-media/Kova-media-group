-- Row Level Security: enabled everywhere, permissive to no one (ADR-006).
--
-- Prisma connects as the table owner, so RLS does not constrain our own
-- queries. This exists so that if the Supabase anon key leaks, or a Client
-- Component ever instantiates a Supabase client and queries a table, it reads
-- exactly zero rows.
--
-- ENABLE only — deliberately NOT `FORCE`. `FORCE ROW LEVEL SECURITY` would
-- apply these (non-existent) policies to the table owner as well, and since
-- Prisma connects as the owner, that would lock the application out of every
-- table. ENABLE stops the `anon` and `authenticated` roles while leaving the
-- owner unaffected, which is exactly the intent.
--
-- Anyone wanting legitimate client-side access must add an explicit policy —
-- a visible, reviewable act rather than an accident.

ALTER TABLE "AdminUser"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Page"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseStudy"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentRevision"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerLogo"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailExample"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitEntry"    ENABLE ROW LEVEL SECURITY;

-- Revoke the blanket grants Supabase issues to its API roles. RLS already stops
-- these roles, but removing the privilege as well means a future permissive
-- policy added by mistake still cannot expose data on its own.
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;

-- SiteSettings is a single row. The application upserts on a fixed id; this
-- makes a second row impossible at the database level rather than by convention.
ALTER TABLE "SiteSettings"
  ADD CONSTRAINT "SiteSettings_singleton" CHECK (id = 'singleton');
