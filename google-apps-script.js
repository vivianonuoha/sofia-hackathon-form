// ============================================================
// Google Apps Script — Sofia University Hackathon Form Backend
// ============================================================
// 
// This script receives form submissions via HTTP POST and
// writes them into a Google Sheet. It also saves the signature
// image to a Google Drive folder.
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com and create a new project
// 2. Paste this entire file into the Code.gs editor
// 3. Update SHEET_ID and FOLDER_ID below with your own IDs
// 4. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL and add it to your .env.local file
// ============================================================

// ── CONFIGURE THESE ──────────────────────────────────────────
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';   // From the Sheet URL
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';  // For signature images
// ─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Student Name',
        'Student ID',
        'Major',
        'Other Major',
        'Project',
        'Acknowledged',
        'Signature Link',
      ]);
      // Bold the header row
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    }

    // Save signature image to Drive
    let signatureUrl = '';
    if (data.signature) {
      try {
        const base64Data = data.signature.replace(/^data:image\/png;base64,/, '');
        const blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data),
          'image/png',
          'signature_' + data.studentId + '_' + Date.now() + '.png'
        );
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        signatureUrl = file.getUrl();
      } catch (imgErr) {
        signatureUrl = 'Error saving signature: ' + imgErr.toString();
      }
    }

    // Append the row
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.studentName,
      data.studentId,
      data.major,
      data.otherMajor || '',
      data.project,
      data.acknowledged,
      signatureUrl,
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
