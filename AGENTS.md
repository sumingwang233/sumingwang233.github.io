# Academic homepage maintenance

This is Xin Wang / 王鑫's public bilingual HugoBlox Academic-CV website. Follow the owner's latest explicit corrections. The approved 2026-10-05 migration replaces the historical Jekyll and JSON workflow.

## Canonical sources

- Native author YAML: `data/{zh,en}/authors/me.yaml`
- Markdown facts: `content/{zh,en}/research/`, `projects/`, `publications/`, and `experience.md`
- Labels/config: `i18n/`, `config/_default/`
- The homepage, details and both academic CVs query those files. `.local/public-profile.json` is a disposable validation projection, never a second maintained source.
- Stable IDs, date precision, publication author order and DOI remain unchanged. Research PROM counts are 283 patients, 100 family members and 17 experts. Do not import the job resume's conflicting 316/196 counts or new psychometric claims.
- Core facts and CVs remain fully bilingual. Notes/journals may begin in Chinese; English archives identify the language and link the real Chinese body. Create translated pages only with actual translations.

## Approved presentation

The hero's primary heading is 王鑫 / Xin Wang, with the localized assistant role below it. Preserve Be Water, my friend, the left circular original lifestyle photo and two resume downloads. No intro email button. The page retains the current Noto fonts, warm rough book-paper texture and green accent.

Homepage order: introduction; education; skills & languages; academic interests; research overview; publication; GameLibrary and Digital Employee Benchmark; selected notes; hobby carousel; contact. Full diagrams and implementation explanations belong in detail pages. Campus experience, honors and other experiences belong in the experience page and academic CVs.

Preserve the official WHU emblem only beside the homepage education title, GameLibrary's approved application icon beside web titles, a right-aligned bold supervisor, and the ordinary inherited-color contact label outside the email link. Keep the hobby counter visually hidden and available to screen readers. Preserve old homepage anchors and all four original page routes plus three PDF addresses.

Reuse the accessible native dialog, bounded image zoom/pan, keyboard/touch controls and focus restoration. Keep direct-image no-JS fallback, native record-menu disclosure, native touch carousel, interruptible transitions and reduced-motion behavior. Content is visible without JavaScript. CV pages have no viewer/reveal/carousel scripts; printable academic CVs are compact text and each two A4 pages.

## Public boundary

Allowed: approved career facts, public email sumingwang@qq.com, existing public GitHub/DOI links, approved diagrams and owner-authorized metadata-free photos. Do not publish phone numbers, original Word/PDF sources, certificates, IDs, private paths, research/interview data or enterprise internals. Do not add inferred publications, results, degree types, completion or unverified Scholar/ORCID links.

The first two notes only organize previously approved experimental-design and GameLibrary architecture material. The diary archive explicitly has no published entries; do not invent autobiographical writing. Photography includes 12 authorized photographs in four groups. Originals are untouched, public derivatives have no EXIF/XMP or private provenance, and local source maps stay in `.local/`. Do not scan unrelated drives/folders for routine updates.

The job resume `files/job-resume-public.pdf` is the already approved redacted derivative. Private contacts are actually deleted from its PDF content; metadata, attachments, forms, annotations and links are absent. Never substitute the original source PDF.

`.local/`, `.openai/`, runtimes, private review PDFs, original photos and source documents remain excluded from Git and deployment. Module static mounts are explicit public allowlists. CI artifacts contain only named public screenshots and generated academic CV PDFs.

## Updating and checking

Work only when asked; no watcher, scheduled task, automatic Scholar crawl or paid API. Use `scripts/inspect_sources.py` for the existing local CV comparison when the owner asks to check CV changes; source-text baselines remain private. Source changes do not prove public approval or deployment.

Use Hugo Extended 0.162.0, pnpm 10.14.0 and the pinned modules/lockfile. Local build tools belong in a private project runtime; do not change system/user environment variables. Keep the original AcadHomepage and HugoBlox licenses.

Run `python scripts/prepare_assets.py`, `python scripts/validate.py`, `pnpm run build`, `pnpm run verify`, and `python scripts/validate.py --site public`. Inspect desktop/mobile homepage, representative details, gallery and all four CV PDF pages. Checks cover canonical bilingual content, full detail/CV facts, author order, local links, original 28 plus new viewports, viewer/carousel/navigation, no-JS/reduced motion, photo metadata and PDF privacy.

Use a dedicated branch and review PR; attach created PRs to the chat. User authorization in the current conversation controls publication. PRs validate only; approved main changes deploy via GitHub Actions. A failure must keep the prior deployment; recover with a correction or revert, never force-push. Sites is a separate deployment and is not updated by this migration.
