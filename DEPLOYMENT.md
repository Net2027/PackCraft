# PackCraft: static pages and Railway

The public site is generated from `packs-data.json`. Every published item receives a real HTML page, and the same build updates the category archives, homepage discoveries, sitemap, and machine-readable catalog. Existing item slugs and URLs are retained.

The large download files stay at their existing GitHub raw URLs. The Pages workflow checks out only named website sources, the small catalog, tests, and website artwork using sparse checkout. It does not check out the `Mod`, `Pack`, `Shader`, or `Film` download directories, or the full repository history. The Pages artifact contains only the generated public website.

## Local build and preview

Use Node.js 22 or later. No package installation is needed.

```powershell
rtk proxy node --test --test-isolation=none
rtk proxy node build-pages.js --out _site
$env:PREVIEW_ROOT = (Resolve-Path _site).Path
rtk proxy node server.js
```

The preview listens on `127.0.0.1:3000`. `PORT` can select a different port. `HOST` can be set explicitly when a different interface is needed. `server.js` is a static development preview, not the Railway API. It denies source files, local review files, operator account data, path traversal, and links that resolve outside its public root.

## Pages setup

In the repository's **Settings → Pages → Build and deployment**, choose **GitHub Actions**. Keep the existing custom domain `packcraft.ir` and its DNS settings. Pushes to `main` that update the catalog or website sources run `.github/workflows/pages.yml`; the workflow can also be started manually. The build runs tests, generates `_site`, rejects private files, uploads that directory, and deploys it using the `github-pages` environment.

This checkout has no production Railway backend source or deployment configuration. No root `package.json`, replacement API, or Railway start command has been added, because adding a new runtime manifest could change Railway's current build detection. The frontend still uses `https://web-production-b6b4a.up.railway.app`.

## Required contract for automatic admin publication

The checked-in admin UI sends creates and edits to `/api/admin/{category}`, deletes to `/api/admin/{category}/{name}`, and approval to `/api/admin/{category}/{name}/approve`. Operator submissions require admin approval. These calls go to Railway. The local static preview does not implement them.

For an admin action to publish a new page automatically, the existing backend must commit the updated **public** `packs-data.json` to `main` after an approved create, edit, delete, or approval. The commit must include the final file URLs, name, description, compatibility, icon, and public status fields. Pending operator submissions and credentials must not enter this public export. On edits, the backend should preserve the item's existing `id`, `slug`, and `url` so previously shared links continue to work.

That catalog commit triggers the Pages build. Adding a binary file to a download folder alone does not tell a static generator the item's title, status, or published URL. A `repository_dispatch` event with type `catalog-updated` is also supported, but it only rebuilds the catalog already committed to `main`; it is not a substitute for exporting the new data.

There is no verified public catalog-export endpoint in the files provided here. Do not wire a guessed Railway URL into the workflow or expose an admin token to the frontend. If the production backend currently keeps its catalog only in memory, its existing save/approval handler needs the JSON export step above. That production behavior must be verified against the actual backend before claiming that admin-to-Pages publication is complete.

## Verification after publication

1. Confirm the **Build and deploy PackCraft Pages** workflow succeeds for the published commit.
2. Open `/mods/` and one existing Persian mod URL on `https://packcraft.ir`.
3. Add or approve a test item using the existing admin panel, confirm that the backend commits its public catalog entry, then check its page and sitemap entry after the deployment completes.
4. Edit the item's display name and confirm its existing URL still works. Delete the test entry and verify the next generated artifact omits its page.

`operators.json` is not part of the public artifact. Excluding it from a new deployment does not remove it from an already public Git repository or its history; account storage and rotation belong to the existing Railway backend's credential management.
