# How to add an image

Images are managed in the browser at **/admin/images**, on a computer or a phone. Every place on the site that can
show a photo is a **slot**. A slot shows its live image, or a calm brand pattern until it has one.

**The two rules**
- **AI images are only for illustrative slots** (decorative scenes on page headers). Never present one as client work,
  results, our team or our office.
- **Real-only slots take real photos only.** The admin and the server both refuse anything else.

---

## Step by step

### 1. Open the slot
Admin → **Images**. Filter by page, industry or status if you like ("Empty", "Needs review", "Live"). Tap the slot.

The slot page shows:
- where the image appears (with a link to the page),
- the sizes it will be made in (desktop 16:9, phones 4:5, share image 1200×630, cards 4:3),
- the minimum upload size,
- the ready-made **prompt** and **negative prompt**.

### 2. Generate the image (illustrative slots)
1. Tap **Copy prompt**. Paste it into ChatGPT or Claude.
2. Ask for a **landscape 3:2** image, **1536×1024 or larger**.
3. If the tool has a field for things to avoid, tap **Copy negative prompt** and paste it there.
4. Generate a few and **pick the most natural one**: real light, believable people from behind or at a distance, no
   text, nothing that looks like a specific client or our team.
5. Download the original (PNG or JPG).

For a **real-only** slot there is no prompt. Take or choose a real photo instead (landscape, at least the size shown).

### 3. Upload
1. Under **Upload**, choose **Real photo** or **AI illustrative**. On real-only slots only "Real photo" is possible.
2. Optional: add a credit (photographer or source).
3. Drag the file onto the box, or tap **Choose a file** (on a phone this opens your gallery or camera).
4. The admin checks the type (JPG, PNG, WebP), size (up to 25 MB) and shape. If something is wrong, it tells you
   exactly what, e.g. "Too small for the 16:9 crop… generate it at 1536×1024 or larger".

The upload appears as **"Uploaded – needs review"**. Nothing has changed on the website yet.

### 4. Set the focal point
In **Review version N**, drag the gold point to the most important part of the picture (a face, a product, the
centre of the scene). Every crop preview beside it follows: desktop 16:9, phone 4:5 and share image. Make sure
nothing important is cut off in any of them. On a keyboard, tab to the point and use the arrow keys (Shift = bigger steps).

### 5. Review honestly and tick the checklist
Zoom in on the original and tick each point only if it is true:
- [ ] Hands and fingers look natural
- [ ] Faces look natural
- [ ] No text, watermarks or logos
- [ ] The setting is believably Indian
- [ ] Nothing misleading (not shown as client work, team, office or results)
- [ ] Matches the brand mood (calm, natural, muted warm tones)

If any point fails, tap **Delete upload** and try another image. **Approve** stays locked until all six are ticked,
and the server checks them again.

### 6. Approve and publish
Tap **Approve and publish**. The server makes AVIF and WebP files in every size (10–20 seconds), removes all
camera/location data, stores them, and the page updates **within seconds**. The slot now shows **Live**.

Approving an industry page header also creates that page's **share image** (what WhatsApp, LinkedIn and Facebook show),
unless the share image has its own upload.

---

## Change, undo, remove

- **Replace:** upload a new image and approve it. The old one moves to *Version history*.
- **Undo (roll back):** in *Version history*, tap **Restore this version** on an earlier one. It is live again in seconds.
- **Take it off the site:** tap **Remove from site** on the live version. The slot shows the brand pattern again. The
  image stays in history, so you can restore it.
- **Delete for good:** only for versions that are not live: **Delete** in history (or **Delete upload** for an unreviewed one).

Everything is recorded under **Activity**: who uploaded, approved, replaced, restored, removed or deleted what, and when.

## If something goes wrong

| You see | Do this |
| --- | --- |
| "Too small for the … crop" | Generate or export a bigger image (1536×1024 or larger). |
| "Wrong shape" | Use a landscape (3:2) image, not a portrait or a very wide panorama. |
| "Only a real photo is allowed here" | This slot is real-only. Use a real photo. |
| "Tick every review item" | Every checklist point must be ticked. If one is not true, use a different image. |
| Publishing takes long or fails | Try again once. If it keeps failing, check Vercel → Logs for `[admin]`. |
| The public page still shows the old image | Hard-refresh the page. Updates are usually live within seconds. |

The website never breaks because of images: if Supabase is unreachable, pages show the brand pattern instead.
