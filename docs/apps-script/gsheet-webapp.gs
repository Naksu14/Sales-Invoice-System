// Apps Script: POST endpoint to append rows to a Google Spreadsheet
// Replace SHEET_ID with your spreadsheet ID (from the URL)
const SHEET_ID = "1q23JvckC2roRzABVJbJomUiX5SmDJSdq2Z9BtUdPLYU";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const name = payload.name || "";
    const age = payload.age || "";

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];

    // Append row: timestamp, name, age
    sheet.appendRow([new Date(), name, age]);

    const output = { status: "ok", message: "Row appended" };
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    const output = { status: "error", message: err.message };
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
      ContentService.MimeType.JSON,
    );
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ready" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
