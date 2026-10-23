# Fotografia · Gabriela Ferreira

Static photography gallery for GitHub Pages. PT-PT, responsive photo grid, keyboard and touch lightbox, per-photo downloads, and album access using a password-derived key.

## Album access

The photo list is encrypted with AES-256-GCM and a PBKDF2-SHA256 key (250,000 iterations and a random salt). No plaintext password, password hash, or unencrypted Drive IDs are committed. The browser decrypts the list after entry; nothing is saved in localStorage or sessionStorage. Reloading or closing the album locks it again.

This is casual access control, not private photo hosting. Drive files are shared with anyone who has their links. An unlocked visitor can copy or share them. Robots exclusions discourage indexing but do not enforce access control.

## Photos and downloads

Photos stay on Drive. The page uses public Google image delivery URLs for 800 px previews, 2400 px viewing and download (`=d`). Delivery is dependent on Google; these public image URLs are not a guaranteed gallery hosting API. Downloads use a browser Blob to keep visitors on the gallery. If Google blocks that request, the interface offers the image itself as a manual save fallback, without opening the Drive interface. The original Drive file is never replaced by this site.

The current album is a snapshot of 92 photos. Adding or removing files in Drive does not automatically update this encrypted list. A new encrypted manifest must be generated for changes or a password change. Keep the password outside the repository.

## Publish

In repository Settings → Pages, select Deploy from a branch → main → / (root), then Save. No build step or paid service is required.
