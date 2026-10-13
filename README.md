# Dr. Dimas Beauty Services: patient records (PWA)

Installable web app for an iPad (Safari → Share → **Add to Home Screen**). It works offline.

## Privacy model
- **This repository holds code only. It never holds patient data.**
- Everything captured is stored **encrypted** (AES-256-GCM) in the device's IndexedDB. That covers patients, sessions, consents, signatures and photos.
- The data key is wrapped twice with PBKDF2-SHA256 (310k iterations):
  - with the clinic's 6-digit passcode;
  - with a printed recovery code.
- Without one of those, the data cannot be read. That includes the hosting provider and whoever maintains the code.
- Backups are the same encrypted blobs, exported as a single file to the clinic's own iCloud Drive or Files.
- No analytics, no third-party scripts, no network calls with data.

## Structure
- `index.html`: the shell and all the styles.
- `sw.js`: offline cache, code only.
- `js/`:
  - `crypto.js`, `db.js`, `store.js`: encryption and storage.
  - `content.js`: the clinic's consent and instruction texts. These are **drafts pending the doctor's approval**.
  - `face.js`: the face map (front and left profile illustrations, mirrored for the right side) with its anatomical zones.
  - `model.js`: summaries, pricing and follow-up rules.
  - `screens/*.js`: the UI.
  - `i18n.js`: English and Spanish strings.

## Roadmap (v0.2)
- Encrypted automatic cloud sync between devices.
- Automatic reading of the lot number and expiry date from the product sticker.
- Sculptra consent, once the clinic provides the text.
- Spanish consent versions, once they are approved.
