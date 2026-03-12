import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {

  async appendRow(data: any) {

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:3001/spreadsheets"
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const sheets = google.sheets({
      version: 'v4',
      auth
    });

    const spreadsheetId = "19Vr3KzG_w8MOr9qnCzOelMzLrLj_wphCOgs75ru21_Y";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.invoice,
            data.client
          ]
        ]
      }
    });

  }

}