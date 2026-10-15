# 29: Recite-Along: hold and timed pace

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Recite-Along highlights Arabic words in the Supplication reader by holding or by timed pace (slow/normal/fast), using the domain matcher and normalisation.

**Blocked by:** 27 (Books data and Supplication reader)

**Status:** ready-for-agent

- [x] Domain tests: normalisation, fuzzy match, prefixes, 8-word lookahead, forward-only, U+200F stripping (`packages/domain/src/recite-along/{normalize,matcher}.test.ts`; the old app's `verify-recite-matcher.ts` cases are the fixtures)
- [ ] Hold and auto modes work; restart resets (code complete: the hold/pace/pause/restart model is `reciteStep` in `@alrisali/domain/recite-along`, tested in `progress.test.ts`; native feature `recite-along` composed into the Supplication reader by the route via a "Read / Recite-Along" toggle, method and pace persisted on device, controls pinned under the text; pending simulator verification)

Notes: the voice/hybrid matcher (`createReciteMatcher`) is ready for ticket 30; touch and voice share one position, so ticket 30 should `seek` the matcher on touch advances and dispatch the matcher position into `reciteStep` (add a voice event there).
