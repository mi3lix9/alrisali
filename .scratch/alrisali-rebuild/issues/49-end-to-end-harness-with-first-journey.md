# 49: End-to-end harness with first journey

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** tester.army e2e set up in the e2e package against an iOS simulator dev build, with the first journey: onboarding as Guest, log a Salah, see the Prayer Streak.

**Blocked by:** 05 (Prayer Log and Prayer Streak)

**Status:** done — pending env: GitHub Actions billing (e2e.yml first run)

- [ ] Journey passes locally and in CI (macOS runner) — passes locally (web + iOS simulator iPhone 17, 2026-10-15); CI job `.github/workflows/e2e.yml` (macos-26) pending first GitHub Actions run
- [x] Pattern documented for later journeys (packages/e2e/README.md)
