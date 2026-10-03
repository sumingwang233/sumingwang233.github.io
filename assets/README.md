# Public assets

- `images/gamelibrary.webp`: optimized copy of the publicly released example interface at [GameLibrary](https://github.com/sumingwang233/GameLibrary/blob/main/website/public/assets/library.png). It shows the project’s example library, not a personal game directory. The published screenshot was identified as v1.5.5 on 2026-10-02.
- `fonts/noto-serif-sc.woff2` and `fonts/noto-sans-sc.woff2`: text-specific subsets of [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc) and [Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc), self-hosted under the accompanying SIL Open Font License files.
- `images/favicon-avatar.png`: 64px web export of an AI-designed bold hair-and-glasses mark, inspired by the manga portrait; used as the favicon on all four routes
- `images/favicon-personal.png`: retained owner-supplied photographer/skyline logo, edited with image_gen to remove the bottom SUMING nameplate and decorative dots and make the background transparent; no longer used as the favicon
- `images/favicon.svg`: retained original W letterform; no longer used as the page icon
- `images/portrait-lifestyle.jpg`: metadata-free 1200x800 web export of the owner-supplied lifestyle photograph; displayed through a circular CSS crop centered on the person, without illustration or filters; original unchanged
- `images/portrait-lifestyle-color.png`: retained AI-generated colored manga portrait; no longer displayed
- `images/portrait-anime.png`: retained earlier black-and-white manga portrait; no longer displayed
- `images/portrait-lineart.png`: retained earlier engraving-style self-portrait; no longer displayed
- `images/portrait.jpg`: retained original approved photograph copy; EXIF/XMP/IPTC metadata is excluded
- `images/education-campus.jpg`: retained owner-supplied campus building night photograph, with identical pixels and EXIF/XMP/IPTC metadata excluded; no longer displayed
- `images/book-paper-rough.png`: AI-generated coarse blank old-book paper texture, tiled at low opacity; not a photograph of a particular book
- `images/book-paper.png`: retained earlier fine-grain paper texture
- `images/hobby-{photography,games,cycling,fitness}.jpg`: the owner's own autumn-lake, gaming-desk, lakeside-bicycle and sports-field photographs, selected from the explicitly authorized photo backup; resized to a maximum of 1600px and exported without EXIF/XMP/IPTC or GPS metadata; originals unchanged
- `images/emotion-experiment.png`: the owner-supplied overview of the emotion-regulation research series, presented unchanged with a full-size link
- `images/dormitory-cooking.png`: retained screenshot from the owner’s Godot prototype review; the homepage now displays a game architecture figure instead
- GameLibrary uses a responsive HTML architecture figure checked against the current project source and architecture documentation, including scanning, review, library organization, launch tracking, backup and UI synchronization; its technical labels live in `_data/profile.json` and describe current source rather than all stable-release features
- The cooking prototype uses the same responsive figure structure, checked against its actual Godot scenes, Autoload configuration, EventBus signals, gameplay systems, Resource data and JSON snapshot storage
- The thesis theory diagram is transcribed from the owner’s original presentation as a responsive HTML figure; it contains no result coefficients or personal identifiers
- The Digital Employee Benchmark figure summarizes the approved general CV's task design, expert alignment and layered evaluation; it includes no enterprise documents, task examples or performance scores

Run `python scripts/prepare_assets.py` after editing public text. It updates font subsets only and never downloads or replaces the owner’s images. Source font binaries and the old screenshot cache are local-only and are not deployed.
