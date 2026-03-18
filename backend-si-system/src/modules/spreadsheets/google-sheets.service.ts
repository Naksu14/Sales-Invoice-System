import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private extractSpreadsheetId(spreadsheetUId: string) {
    const value = (spreadsheetUId || '').trim()

    if (!value) {
      throw new InternalServerErrorException('Spreadsheet ID is empty')
    }

    const fullUrlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (fullUrlMatch?.[1]) return fullUrlMatch[1]

    const idWithSuffixMatch = value.match(/^([a-zA-Z0-9-_]+)(?:\/edit.*)?$/)
    if (idWithSuffixMatch?.[1]) return idWithSuffixMatch[1]

    throw new InternalServerErrorException(`Invalid spreadsheet ID format: ${value}`)
  }

  private getServiceAccountEmail() {
    return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || ''
  }

  private getServiceAccountPrivateKey() {
    return (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  }

  private getClientId() {
    return process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || ''
  }

  private getClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || ''
  }

  private hasOauthConfig() {
    return Boolean(
      this.getClientId() &&
      this.getClientSecret() &&
      process.env.GOOGLE_REFRESH_TOKEN,
    )
  }

  private hasServiceAccountConfig() {
    return Boolean(this.getServiceAccountEmail() && this.getServiceAccountPrivateKey())
  }

  private getWebAppUrl() {
    return process.env.GOOGLE_SHEETS_WEBAPP_URL?.trim()
  }

  private getSheets() {
    if (this.hasServiceAccountConfig()) {
      const auth = new google.auth.JWT({
        email: this.getServiceAccountEmail(),
        key: this.getServiceAccountPrivateKey(),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      return google.sheets({ version: 'v4', auth })
    }

    if (!this.hasOauthConfig()) {
      throw new InternalServerErrorException(
        'Google Sheets auth is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN, or configure GOOGLE_SHEETS_WEBAPP_URL.',
      )
    }

    const auth = new google.auth.OAuth2(
      this.getClientId(),
      this.getClientSecret(),
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3004/spreadsheets',
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return google.sheets({ version: 'v4', auth });
  }

  private async appendRowViaWebApp(spreadsheetId: string, sheetTabName: string, rowValues: string[]) {
    const webAppUrl = this.getWebAppUrl()
    if (!webAppUrl) return false

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId, sheetTabName, rowValues }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new InternalServerErrorException(`Google Sheets web app write failed: ${text || response.statusText}`)
    }

    return true
  }

  /**
   * Append a row to a Google Sheet.
   * @param spreadsheetUId  The spreadsheetUId stored in DB (may contain trailing path like "/edit?gid=0#gid=0")
   * @param sheetTabName    The exact sheet tab name, e.g. "Sheet1"
   * @param rowValues       Ordered array of cell values matching the sheet columns left-to-right
   */
  async appendRow(spreadsheetUId: string, sheetTabName: string, rowValues: string[]): Promise<void> {
    const spreadsheetId = this.extractSpreadsheetId(spreadsheetUId)

    try {
      if (await this.appendRowViaWebApp(spreadsheetId, sheetTabName, rowValues)) {
        return
      }

      const sheets = this.getSheets();
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTabName}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
      });
    } catch (err) {
      throw new InternalServerErrorException(`Google Sheets write failed: ${err.message}`);
    }
  }

}