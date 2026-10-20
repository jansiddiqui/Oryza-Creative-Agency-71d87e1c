# image-inbox

Drop approved originals here, named by slot: `<slot-id>.png` (or `.jpg` / `.webp`), optionally `<slot-id>@4x5.png`
for a dedicated portrait version and `<slot-id>.json` for focal point / source / credit.

Then run `npm run images:process -- --by "Your name"`. Slot ids, sizes, prompts and the review checklist are in
`docs/image-prompts.md`. Originals are git-ignored; processed files go to `public/images/` and the manifest.
