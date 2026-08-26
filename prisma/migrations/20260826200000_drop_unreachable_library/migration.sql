-- Neither record type had a public surface, and both tables were empty.
--
-- Partner badges store a media id on the section itself and the client strip is
-- a list of names, so a PartnerLogo row had nothing to render into. EmailExample
-- never had an admin screen, so it could not be populated at all. Dropping them
-- removes two admin controls that could never produce anything on the site.
DROP TABLE IF EXISTS "PartnerLogo";
DROP TABLE IF EXISTS "EmailExample";
