# Exporting Zones and Device Positions

> **AI Note**: Instructions for exporting current state as seed data. See [SEEDING.md](./SEEDING.md) for seeding overview.

**Guide for exporting and persisting zones and device positions across deployments.**

## Problem
When you push code to GitHub and deploy to Vercel, your zones and device positions are lost because they're stored in browser localStorage, which doesn't persist across deployments.

## Solution
Export your current state and commit it as seed data. The app will automatically use this seed data on fresh deployments, making your current state the default.

## Quick Workflow: Make Current State the Default

### Before Pushing (when you want to save your current state):

1. **Open your local app** in the browser (e.g., `http://localhost:3000`)
2. **Open the browser console** (F12 or Cmd+Option+I)
3. **Run this command:**
   ```javascript
   exportFusionData()
   ```
   
   This will:
   - Display the TypeScript code in the console
   - **Download 3 files automatically:**
     - `seedZones.ts` - Ready to use!
     - `seedDevices.ts` - Ready to use!
     - `fusion-data-export-YYYY-MM-DD.json` - Backup JSON

4. **Move the downloaded files:**
   ```bash
   mv ~/Downloads/seedZones.ts lib/seedZones.ts
   mv ~/Downloads/seedDevices.ts lib/seedDevices.ts
   ```

5. **Commit and push:**
   ```bash
   git add lib/seedZones.ts lib/seedDevices.ts
   git commit -m "Update seed data with current zones and device positions"
   git push origin main
   ```

That's it! Your current state is now the default for all future deployments.

### Alternative: Using JSON Export

If you prefer to use the JSON file:

1. Export using `exportFusionData()` (downloads JSON)
2. Run: `npm run seed:generate <path-to-json-file>`
3. This generates the seed files automatically
4. Commit and push as above

## How It Works

The app checks for data in this priority order:
1. **Seed data** (from `seedZones.ts` and `seedDevices.ts`) - Used on fresh deployments
2. **localStorage** (browser storage) - Used when user has made changes locally
3. **Default data** (from `initialZones.ts` and `mockData.ts`) - Fallback if nothing else exists

This means:
- Fresh deployments use your committed seed data
- Local development uses localStorage (your current edits)
- If you update seed data and push, new deployments will use the updated data

## Notes

- The seed files are committed to the repository, so they persist across deployments
- You can update seed data anytime by exporting and committing again
- Seed data takes precedence over localStorage on fresh page loads, but localStorage will override it if you make changes locally

