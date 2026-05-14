-- Migration: add cloudinary_public_id to artwork_images
-- Rename this file to the next version in your migration sequence,
-- e.g. V4__add_cloudinary_public_id.sql
--
-- NULL for existing rows (legacy images not uploaded via Cloudinary).
-- Populated automatically for any new image uploaded through the API.

ALTER TABLE artwork_images
    ADD COLUMN cloudinary_public_id VARCHAR(512) NULL;