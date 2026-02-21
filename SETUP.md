# Sofia University Hackathon Registration Form — Setup Guide

This guide walks you through setting up the Google Sheet backend, configuring the project, and deploying to Vercel.

---

## Prerequisites

- A Google account (for Sheets + Drive)
- A GitHub account
- A Vercel account (free at [vercel.com](https://vercel.com) — sign in with GitHub)
- Node.js 18+ installed locally (download from [nodejs.org](https://nodejs.org))

---

## Step 1: Create the Google Sheet & Drive Folder

### 1a. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and click **Blank spreadsheet**
2. Name it something like `Hackathon Registrations`
3. **Copy the Sheet ID** from the URL — it's the long string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```

### 1b. Create a Google Drive Folder for Signatures

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called `Hackathon Signatures`
3. **Copy the Folder ID** from the URL — the string after `/folders/`:
   ```
   https://drive.google.com/drive/folders/THIS_IS_YOUR_FOLDER_ID
   ```

---

## Step 2: Set Up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com) and click **New Project**
2. Delete any existing code in the editor
3. Open the `google-apps-script.js` file from this project and **copy the entire contents**
4. Paste it into the Apps Script editor
5. **Replace the two placeholder values** near the top:
   ```js
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';    // ← paste your Sheet ID
   const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';   // ← paste your Folder ID
   ```
6. Click **Save** (💾 icon or Ctrl+S)

### Deploy the Script as a Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: `Hackathon Form Backend`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. You may need to authorize the script:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to [project name] (unsafe)**
   - Click **Allow**
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

> **Keep this URL safe!** You'll need it in the next step.

---

## Step 3: Set Up the Next.js Project Locally

### 3a. Clone / Download the project

If you pushed it to GitHub already:
```bash
git clone https://github.com/YOUR_USERNAME/sofia-hackathon-form.git
cd sofia-hackathon-form
```

Or just navigate to the project folder.

### 3b. Install dependencies

```bash
npm install
```

### 3c. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace the placeholder with your Google Apps Script URL:

```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

### 3d. Test locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Fill out the form and submit — check your Google Sheet to confirm the data appears!

---

## Step 4: Deploy to Vercel

### 4a. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - hackathon registration form"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sofia-hackathon-form.git
git push -u origin main
```

### 4b. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Select your `sofia-hackathon-form` repository
4. Vercel auto-detects Next.js — no configuration needed
5. **Add the environment variable**:
   - Click **Environment Variables**
   - Name: `GOOGLE_SCRIPT_URL`
   - Value: Your Google Apps Script URL from Step 2
   - Click **Add**
6. Click **Deploy**
7. Wait ~1 minute — Vercel will give you a URL like:
   ```
   https://sofia-hackathon-form.vercel.app
   ```

Your form is now live!

---

## Step 5: Custom Domain (Optional)

If you want a custom `.vercel.app` subdomain:

1. Go to your project in Vercel Dashboard
2. **Settings** → **Domains**
3. Type your preferred subdomain (e.g., `sofia-hackathon.vercel.app`)
4. Click **Add**

---

## How It Works

```
[User fills form + signs] 
        ↓
[Next.js API route /api/submit]
        ↓
[Google Apps Script Web App]
        ↓
[Writes to Google Sheet] + [Saves signature PNG to Drive folder]
```

Each submission creates a row with: Timestamp, Student Name, Student ID, Major, Other Major, Project, Acknowledged (Yes/No), and a link to the signature image in Drive.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Form submits but nothing in Sheet | Check the `GOOGLE_SCRIPT_URL` env variable is correct |
| "Google Script URL not configured" | Make sure `.env.local` exists locally or env var is set in Vercel |
| Authorization error in Apps Script | Re-authorize: Run `doPost` manually in the editor, then re-deploy |
| Signature not saving | Check the Drive folder ID is correct and the script has Drive permissions |
| CORS errors | Make sure the Apps Script is deployed with "Anyone" access |

---

## Updating the Form

To make changes:

1. Edit the code locally
2. Test with `npm run dev`
3. Commit and push to GitHub — Vercel auto-deploys on push!

---

## Security Notes

- The Google Apps Script URL is kept server-side (in your API route), never exposed to the browser
- Signatures are stored as PNG files in your private Drive folder
- Only you (the Sheet/Drive owner) can see the full data
- Consider adding rate limiting or CAPTCHA for production use
