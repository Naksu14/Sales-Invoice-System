Apps Script Web App for appending and updating rows in Google Sheets

Overview

- This Apps Script provides a simple POST endpoint that can append rows and update an existing row by match.
- Append payload expects `spreadsheetId`, `sheetTabName`, and `rowValues`.
- Update payload expects `action: "updateRowByMatch"`, `spreadsheetId`, `sheetTabName`, `oldRowValues`, and `newRowValues`.

Setup & Deploy

1. Open https://script.google.com and create a new project.
2. Replace the default Code.gs content with the contents of `gsheet-webapp.gs`.
3. Save the project.
4. Click `Deploy` → `New deployment`.
   - Select **Web app**.
   - Set **Description** as you like.
   - **Execute as**: Me
   - **Who has access**: Anyone (or Anyone with the link) — choose this if you want the React app to POST directly from the browser.
5. Click `Deploy` and authorize if prompted. Copy the **Web app URL**.
6. In the backend environment, set `GOOGLE_SHEETS_WEBAPP_URL` to the deployed web app URL.

Important notes

- If you choose **Anyone** access, the web app will run as you (the script owner) and will be able to write to the spreadsheet.
- For security, avoid exposing this URL in public places unless acceptable.
- If you receive CORS errors in the browser, ensure the web app's access is set to allow anonymous access (Anyone) and that you deploy with **Execute as: Me**.

Testing

- Use `curl` to test the endpoint (replace WEBAPP_URL with the deployed URL):

```bash
curl -X POST $WEBAPP_URL \
  -H 'Content-Type: application/json' \
  -d '{"spreadsheetId":"19Vr3KzG_w8MOr9qnCzOelMzLrLj_wphCOgs75ru21_Y","sheetTabName":"Sheet1","rowValues":["143","Daniela"]}'
```

- Test update-by-match action:

```bash
curl -X POST $WEBAPP_URL \
  -H 'Content-Type: application/json' \
  -d '{"action":"updateRowByMatch","spreadsheetId":"19Vr3KzG_w8MOr9qnCzOelMzLrLj_wphCOgs75ru21_Y","sheetTabName":"Sheet1","oldRowValues":["143","Daniela"],"newRowValues":["143","Daniela Updated"]}'
```
