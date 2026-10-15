# 16: Gatherings and Speakers (with uploads)

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Admins manage Gatherings and Speakers (date, time, venue with map location, photo upload to a Railway bucket, livestream, who may attend, active); devices browse by list/day/week/month/map with a Speaker filter and a detail screen. Builds the Admin-only upload path reused later.

**Blocked by:** 13 (Admin web foundation and content replica)

**Status:** done — pending env: FILES_BUCKET, FILES_BUCKET_ENDPOINT, FILES_BUCKET_REGION, FILES_BUCKET_ACCESS_KEY_ID, FILES_BUCKET_SECRET_ACCESS_KEY, GOOGLE_MAPS_ANDROID_API_KEY; pending simulator verification

- [x] Uploads require an Admin (server test)
- [x] Device views list/day/week/month and an expo-maps map
- [x] Speaker filter and detail with livestream link work
- [ ] Live upload to the Railway bucket (tested against an in-process S3 fake): pending env: FILES_BUCKET, FILES_BUCKET_ENDPOINT, FILES_BUCKET_REGION, FILES_BUCKET_ACCESS_KEY_ID, FILES_BUCKET_SECRET_ACCESS_KEY; Android map needs GOOGLE_MAPS_ANDROID_API_KEY; screens pending simulator verification
