-- Removes the resource centre.
--
-- The blog/resource concept is dropped from the product: maintaining a
-- publication is a standing commitment, and the site is better without one it
-- cannot sustain than with a stale one.
--
-- This table was introduced earlier in the same development cycle and only ever
-- held seeded content, so there is no client data to preserve. Its revision
-- rows are removed explicitly because ContentRevision is polymorphic
-- (entityType + entityId) and has no foreign key to cascade from.
DELETE FROM "ContentRevision" WHERE "entityType" = 'resource';

DROP TABLE IF EXISTS "Resource";
