# Backend: uploaded files are lost on every deploy (critical)

Found 11 Nov 2026. Every file uploaded before the latest backend deploy now answers
`410 The stored file is no longer available`: the test café's CAC certificate (8 Nov), both
request letters (10 Nov) and the "Application for permit" letter. Files uploaded after the
deploy open fine, and will be lost at the next deploy or restart.

Cause (most likely): files are written to the server's local disk, which Render's free tier
wipes on every deploy and restart.

Fix: store file bytes in object storage (S3, Cloudflare R2, Supabase Storage or similar) and keep
only the key, size, type and SHA-256 in the database; or attach a Render persistent disk (paid
plan) and point the upload directory at it. Covers company compliance documents, request
letters and minute attachments. Re-request the lost files from the companies afterwards.
