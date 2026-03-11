Apps Script Web App for appending rows to Google Sheets

Overview

- This Apps Script provides a simple POST endpoint that appends rows to the first sheet of a spreadsheet.
- The script expects JSON with `{ name: string, age: string|number }`.

Setup & Deploy

1. Open https://script.google.com and create a new project.
2. Replace the default Code.gs content with the contents of `gsheet-webapp.gs` (update `SHEET_ID` if needed).
3. Save the project.
4. Click `Deploy` → `New deployment`.
   - Select **Web app**.
   - Set **Description** as you like.
   - **Execute as**: Me
   - **Who has access**: Anyone (or Anyone with the link) — choose this if you want the React app to POST directly from the browser.
5. Click `Deploy` and authorize if prompted. Copy the **Web app URL**.

Important notes

- If you choose **Anyone** access, the web app will run as you (the script owner) and will be able to write to the spreadsheet.
- For security, avoid exposing this URL in public places unless acceptable.
- If you receive CORS errors in the browser, ensure the web app's access is set to allow anonymous access (Anyone) and that you deploy with **Execute as: Me**.

Testing

- Use `curl` to test the endpoint (replace WEBAPP_URL with the deployed URL):

```bash
curl -X POST $WEBAPP_URL \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","age":30}'
```
