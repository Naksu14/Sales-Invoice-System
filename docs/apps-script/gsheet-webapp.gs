// Apps Script: POST endpoint to append rows to a Google Spreadsheet.
// Expected payload:
// {
//   spreadsheetId: "19Vr3KzG_w8MOr9qnCzOelMzLrLj_wphCOgs75ru21_Y",
//   sheetTabName: "Sheet1",
//   rowValues: ["143", "Daniela"]
// }

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const spreadsheetId = payload.spreadsheetId || "";
    const sheetTabName = payload.sheetTabName || "";
    const rowValues = Array.isArray(payload.rowValues) ? payload.rowValues : [];

    if (!spreadsheetId) throw new Error("spreadsheetId is required");
    if (!sheetTabName) throw new Error("sheetTabName is required");

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetTabName);
    if (!sheet) throw new Error("Sheet tab not found: " + sheetTabName);

    sheet.appendRow(rowValues);

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
