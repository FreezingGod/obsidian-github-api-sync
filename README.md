# GitHub API Sync

A bidirectional Obsidian sync plugin that uses the GitHub API (no local git required). It keeps your journal and vault files in sync across devices while preserving folder structure, attachments, and common file operations.

## Features
- Two-way sync between local vault and GitHub repo
- Supports text files, images, and attachments
- Preserves folder structure and handles renames/moves
- Batch commit on push for faster large syncs
- Conflict handling: prefer local/remote, keep both, or manual resolve
- Safety guard against mass remote deletions
- Sync log and conflict list views
- Optional scheduled sync

## How It Works
- Scans your vault, builds a local index (hash/mtime/size)
- Fetches remote tree (incremental when possible)
- Plans pull/push/delete/rename operations
- Executes changes and updates a baseline for next sync

## Installation (Manual)
1. Build the plugin:
   ```bash
   npm run build
   ```
2. Copy `dist/main.js`, `dist/manifest.json`, and `dist/styles.css` into:
   - macOS: `~/Library/Application Support/obsidian/plugins/github-api-sync/`
3. In Obsidian, enable the plugin under Settings → Community plugins.

## Configuration
Open the plugin settings and fill in:
- GitHub Token
- Owner / Repository / Branch
- Root Path (optional)
- Ignore Patterns
- Conflict Policy
- Sync Interval (optional)

### Token Permissions
- Classic PAT: `repo` (private) or `public_repo` (public)
- Fine-grained PAT: Contents (Read/Write), Metadata (Read)

## Usage
- Command palette: **Sync now**
- Ribbon icon: click to sync
- View logs: **Show sync log**
- Resolve conflicts: **Show sync conflicts**

## Notes
- Large files above the configured size limit are skipped.
- If a file is missing locally but exists on GitHub, it will be marked as a conflict for manual decision.

## Development
- Run tests:
  ```bash
  npm test
  ```
- Watch build:
  ```bash
  npm run dev
  ```

## License
MIT
