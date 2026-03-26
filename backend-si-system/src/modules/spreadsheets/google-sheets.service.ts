import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private columnIndexToLetter(columnIndex: number): string {
    let index = columnIndex
    let letters = ''

    while (index > 0) {
      const remainder = (index - 1) % 26
      letters = String.fromCharCode(65 + remainder) + letters
      index = Math.floor((index - 1) / 26)
    }

    return letters
  }

  private normalizeRow(values: unknown[], width: number): string[] {
    const normalized = Array.from({ length: width }, (_, idx) => {
      const value = values[idx]
      return value === undefined || value === null ? '' : String(value)
    })

    return normalized
  }

  private rowsEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false
    return a.every((value, index) => value.trim() === (b[index] || '').trim())
  }

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

    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'appendRow', spreadsheetId, sheetTabName, rowValues }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.warn(`[GoogleSheets] Web app append HTTP error: ${text || response.statusText}`)
        return false
      }

      const payload = await response.json().catch(() => ({}))
      if (payload?.status === 'ok') return true

      console.warn(`[GoogleSheets] Web app append unsupported/error response: ${payload?.message || 'Unknown error'}`)
      return false
    } catch (err) {
      console.warn(`[GoogleSheets] Web app append call failed: ${err.message}`)
      return false
    }
  }

  private async updateRowViaWebApp(
    spreadsheetId: string,
    sheetTabName: string,
    oldRowValues: string[],
    newRowValues: string[],
  ) {
    const webAppUrl = this.getWebAppUrl()
    if (!webAppUrl) return false

    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRowByMatch',
          spreadsheetId,
          sheetTabName,
          oldRowValues,
          newRowValues,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.warn(`[GoogleSheets] Web app update HTTP error: ${text || response.statusText}`)
        return false
      }

      const payload = await response.json().catch(() => ({}))
      if (payload?.status === 'ok') return true
      if (payload?.status === 'not_found') return false

      console.warn(`[GoogleSheets] Web app update unsupported/error response: ${payload?.message || 'Unknown error'}`)
      return false
    } catch (err) {
      console.warn(`[GoogleSheets] Web app update call failed: ${err.message}`)
      return false
    }
  }

  /**
   * Append a row to a Google Sheet.
   * @param spreadsheetUId  The spreadsheetUId stored in DB (may contain trailing path like "/edit?gid=0#gid=0")
   * @param sheetTabName    The exact sheet tab name, e.g. "Sheet1"
   * @param rowValues       Ordered array of cell values matching the sheet columns left-to-right
   */
  async appendRow(
  spreadsheetUId: string,
  sheetTabName: string,
  rowValues: string[],
): Promise<void> {
  const spreadsheetId = this.extractSpreadsheetId(spreadsheetUId);

  if (!rowValues || rowValues.length === 0) {
    throw new InternalServerErrorException('rowValues is empty');
  }

  try {
    // console.log('[GoogleSheets] Append:', rowValues);

    const webAppUrl = this.getWebAppUrl();

    if (webAppUrl) {
      if (await this.appendRowViaWebApp(spreadsheetId, sheetTabName, rowValues)) {
        return
      }

      // Web app failed, continue to direct API fallback
      console.warn('[GoogleSheets] Falling back to direct Google Sheets API for append');
    }

    // Fallback to direct API if no WebApp configured or WebApp failed
    const sheets = this.getSheets();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTabName}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] },
    });

  } catch (err) {
    throw new InternalServerErrorException(
      `Google Sheets write failed: ${err.message}`,
    );
  }
}

  async updateRowByMatch(
  spreadsheetUId: string,
  sheetTabName: string,
  oldRowValues: string[],
  newRowValues: string[],
): Promise<boolean> {
  const spreadsheetId = this.extractSpreadsheetId(spreadsheetUId);

  if (!oldRowValues.length || !newRowValues.length) {
    throw new InternalServerErrorException(
      'oldRowValues or newRowValues is empty',
    );
  }

  try {
    //console.log('[GoogleSheets] Update:', {
    //  oldRowValues,
    //  newRowValues,
    //});

    const webAppUrl = this.getWebAppUrl();

    if (webAppUrl) {
      const updatedViaWebApp = await this.updateRowViaWebApp(
        spreadsheetId,
        sheetTabName,
        oldRowValues,
        newRowValues,
      )

      if (updatedViaWebApp) {
        return true
      }

      // Web app may be outdated or unavailable. Continue with direct API fallback.
      console.warn('[GoogleSheets] Falling back to direct Google Sheets API for update');
    }

    // ❌ ONLY fallback if WebApp not configured
    const sheets = this.getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetTabName,
    });

    const rows = response.data.values || [];
    if (!rows.length) return false;

    const compareWidth = Math.max(oldRowValues.length, newRowValues.length);
    const normalizedOld = this.normalizeRow(oldRowValues, compareWidth);
    const normalizedNew = this.normalizeRow(newRowValues, compareWidth);

    const targetIndex = rows.findIndex((row) =>
      this.rowsEqual(this.normalizeRow(row, compareWidth), normalizedOld),
    );

    if (targetIndex === -1) return false;

    const rowNumber = targetIndex + 1;
    const endColumn = this.columnIndexToLetter(compareWidth);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTabName}!A${rowNumber}:${endColumn}${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [normalizedNew] },
    });

    return true;

  } catch (err) {
    throw new InternalServerErrorException(
      `Google Sheets update failed: ${err.message}`,
    );
  }
}

}