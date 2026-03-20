// Apps Script: POST endpoint to append rows to a Google Spreadsheet.
// Expected payload:
// {
//   spreadsheetId: "19Vr3KzG_w8MOr9qnCzOelMzLrLj_wphCOgs75ru21_Y",
//   sheetTabName: "Sheet1",
//   rowValues: ["143", "Daniela"]
// }
function doPost(e) {
  try {
    // ✅ Debug logs
    Logger.log("RAW: " + e.postData.contents);

    const payload = JSON.parse(e.postData.contents || "{}");
    Logger.log("PARSED: " + JSON.stringify(payload));

    const action = payload.action;

    // ❌ FIX: do NOT default to appendRow
    if (!action) {
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "error",
          message: "Missing action",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheetId = payload.spreadsheetId || "";
    const sheetTabName = payload.sheetTabName || "";

    if (!spreadsheetId) throw new Error("spreadsheetId is required");
    if (!sheetTabName) throw new Error("sheetTabName is required");

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetTabName);
    if (!sheet) throw new Error("Sheet tab not found: " + sheetTabName);

    // =========================================================
    // ✅ UPDATE ROW (MATCH BY ID)
    // =========================================================
    if (action === "updateRowByMatch") {
      const oldRowValues = Array.isArray(payload.oldRowValues)
        ? payload.oldRowValues
        : [];
      const newRowValues = Array.isArray(payload.newRowValues)
        ? payload.newRowValues
        : [];

      if (!oldRowValues.length || !newRowValues.length) {
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "error",
            message: "oldRowValues and newRowValues are required",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();

      if (data.length === 0) {
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "not_found",
            message: "Sheet is empty",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const normalize = (row, width) => {
        return Array.from({ length: width }, (_, i) => {
          const val = row[i];
          return val === undefined || val === null ? "" : String(val).trim();
        });
      };

      const width = newRowValues.length;
      const normalizedOld = normalize(oldRowValues, width);
      const normalizedNew = normalize(newRowValues, width);

      const idToMatch = normalizedOld[0];
      let targetRow = -1;

      Logger.log("Looking for ID: " + idToMatch);

      for (let r = 0; r < data.length; r++) {
        const candidate = normalize(data[r], width);

        if (candidate[0] === idToMatch) {
          targetRow = r + 1;
          break;
        }
      }

      if (targetRow === -1) {
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "not_found",
            message: "Row not found by ID",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      sheet.getRange(targetRow, 1, 1, width).setValues([normalizedNew]);

      return ContentService.createTextOutput(
        JSON.stringify({
          status: "ok",
          message: "Row updated",
          rowNumber: targetRow,
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================
    // ✅ APPEND ROW
    // =========================================================
    if (action === "appendRow") {
      const rowValues = Array.isArray(payload.rowValues)
        ? payload.rowValues
        : [];

      if (rowValues.length === 0) {
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "error",
            message: "rowValues is required for appendRow",
          }),
        ).setMimeType(ContentService.MimeType.JSON);
      }

      sheet.appendRow(rowValues);

      return ContentService.createTextOutput(
        JSON.stringify({
          status: "ok",
          message: "Row appended",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================
    // ❌ INVALID ACTION
    // =========================================================
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Invalid action: " + action,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("ERROR: " + err.message);

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: err.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ✅ Health check
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ready" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
