# Development

Install with `npm ci`. Run `npm run dev` on port 5176, or `npm run build` followed by `npm run preview` on port 4176.

Run `npm test` for content, graph, rubric, source-integrity, and README checks. With the preview running, run `npm run test:browser` for all concept routes, complete readers, assignment views, saved work, writing tools, mobile layouts, and accessibility checks. Browser tests accept only local ports. Run `npm run test:course` for personal course workflows. See [COURSE.md](COURSE.md) for scheduling and mastery behavior.

The library contains 90 concepts, 900 exclusive concept MCQs, 90 concept essays, 90 concept projects, 17 classical-text projects, and 17 complete Gutenberg volumes. Book assignment pages reuse the corresponding canonical MCQs and add 24 text-specific essay prompts. Repeated views do not count as additional questions.

Course data lives in `src/data`. `curriculum.js` provides instruction and projects; question modules load by unit when practice opens. `index.js` exports the complete dataset for validation. The prebuild step exports `public/ontology.json` and question metadata.

`scripts/acquire-books.py` acquires original Gutenberg files and records SHA-256 hashes. Existing downloads are retained. `scripts/build-passages.py` extracts study selections from those local texts. Run these deliberately when changing source material; they are not required to browse or build the site. The acquisition script requires Python 3 and `requests`.

Writing dictionaries are generated locally during installation checks/builds from the pinned dependencies. Their licenses are in `public/licenses`. Student work uses the separate `commonplace-literature-v1` browser-storage key. Workspace exports can be imported without overwriting existing entries.

The README is intentionally empty.
