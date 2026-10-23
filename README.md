# Gwazy · Fotografia

Static photography gallery for GitHub Pages. The homepage shows album cover cards. Clicking an album either opens it immediately or prompts for its password. Gwazy is the primary name; Gabriela Ferreira appears in the footer.

## Default for new albums

New galleries are public and view-only unless the owner explicitly requests different settings. Set `passwordRequired: false` and `downloads: false`; do not add `downloadPasswordSource` by default. Keep context-menu and image dragging disabled. Existing explicit exceptions, such as password-unlocked downloads for Eiras 2025, remain in place.

## Album settings

`albums/index.json` lists the visible albums: title, location, year, photo count, Drive cover ID, source JSON path, `passwordRequired`, and `downloads`.

- `passwordRequired: true`: the source is an encrypted manifest, decrypted after clicking the card and entering its password.
- `passwordRequired: false`: the source is plain JSON in the shape `{ "photos": [{ "id": "DRIVE_FILE_ID", "name": "photo.jpg" }] }` and opens without a prompt.
- `downloads: true`: shows the download button. Any other value hides downloads and prevents the download handler from requesting originals. For view-only albums, context-menu and image dragging are discouraged; screenshots and technical saving remain possible.

`downloadPasswordSource` optionally points to an encrypted manifest used to verify a password and enable downloads for the current album visit. Eiras 2025 opens publicly with 92 photos and downloads locked until this password is entered. Coimbra 2023 opens publicly with 5 photos and has no download unlock. Returning to the album list or reloading clears unlocked access.

## Album access

The protected photo list is encrypted with AES-256-GCM and a PBKDF2-SHA256 key (250,000 iterations and a random salt). No plaintext password or password hash is committed. Album cover IDs are public so the homepage can show previews; the rest of a protected album's photo list is encrypted. The browser decrypts the list after entry; nothing is saved in localStorage or sessionStorage. Reloading or returning to the album list locks it again.

This is casual access control, not private photo hosting. Drive files are shared with anyone who has their links. An unlocked visitor can copy or share them. Robots exclusions discourage indexing but do not enforce access control.

## Photos and downloads

Photos stay on Drive. The page uses public Google image delivery URLs for 800 px previews, 2400 px viewing and download (`=d`). Delivery is dependent on Google; these public image URLs are not a guaranteed gallery hosting API. Downloads use a browser Blob to keep visitors on the gallery. If Google blocks that request, the interface offers the image itself as a manual save fallback, without opening the Drive interface. The original Drive file is never replaced by this site.

The albums are snapshots of their Drive folders. Adding or removing files in Drive does not automatically update their JSON lists. A new encrypted manifest must be generated for changes or a password change. Keep the password outside the repository.

## Publish

In repository Settings → Pages, select Deploy from a branch → main → / (root), then Save. No build step or paid service is required.
