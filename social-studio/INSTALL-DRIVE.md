# Google Drive import setup (optional)

This lets you drop event photos into a Google Drive folder and import them straight into Social Studio, as a second option alongside manual upload. It's entirely optional — the app works fully without it.

## How it works

- One Drive folder (the "root") holds one subfolder per event, e.g. `Smith Wedding`, `Chamber of Commerce Mixer`.
- The app reads that folder through a **service account** — a robot Google account with no inbox or login of its own, given read-only access to just that one folder. It never sees anything else in your Drive.
- Each subfolder shows up as an importable project on the "New project" page; importing pulls in up to 12 JPG/PNG/WebP images from it.

## One-time setup (in Google Cloud Console)

1. Go to <https://console.cloud.google.com/>, create a new project (or use an existing one) — name doesn't matter, e.g. "Seacoast DJ Social Studio".
2. **APIs & Services → Library**: search for "Google Drive API" and enable it.
3. **APIs & Services → Credentials → Create Credentials → Service account**. Give it any name (e.g. `social-studio-drive`). No roles needed — skip that step.
4. Open the new service account → **Keys → Add Key → Create new key → JSON**. This downloads a `.json` file — keep it private, never commit it or paste its contents anywhere public.
5. Note the service account's email address (looks like `social-studio-drive@your-project.iam.gserviceaccount.com`).

## In Google Drive

1. Create (or pick) one folder to be the "root" — e.g. "Social Studio Events".
2. Inside it, create one subfolder per event and drop that event's photos in.
3. **Share the root folder** with the service account's email address (from step 5 above), Viewer access. This single share also covers every subfolder inside it.
4. Open the root folder in a browser and copy its ID from the URL: `https://drive.google.com/drive/folders/`**`THIS_PART`**.

## Environment variables

In Hostinger's environment-variable panel for `social.seacoastdj.com`:

```text
GOOGLE_SERVICE_ACCOUNT_JSON=<paste the entire downloaded JSON file's contents as one line>
GOOGLE_DRIVE_ROOT_FOLDER_ID=<the folder ID from above>
```

Never commit the JSON key file or paste its contents anywhere but Hostinger's env var panel. If it's ever exposed, delete the key in Google Cloud Console (Credentials → that service account → Keys) and create a new one.

## Using it

Once both variables are set, "New project" shows an extra "Import from Google Drive" panel listing your event subfolders. Pick one, fill in the same project details you'd use for a manual upload, and import — the photos land in `storage/uploads` exactly like a manual upload would, so the rest of the workflow (analysis, captions, approval, publishing) is identical either way.
