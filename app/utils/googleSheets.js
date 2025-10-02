import { google } from 'googleapis';

/**
 * Appends email sending results to a Google Sheet
 * @param {Object} config - Google Sheets configuration
 * @param {string} config.spreadsheetId - The ID of the Google Sheet
 * @param {string} config.serviceAccountEmail - Service account email
 * @param {string} config.privateKey - Service account private key
 * @param {Array} results - Array of email sending results
 */
export async function appendToGoogleSheet(config, results) {
  try {
    const { spreadsheetId, serviceAccountEmail, privateKey } = config;

    // Create JWT auth client
    const auth = new google.auth.JWT(
      serviceAccountEmail,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare data rows
    const rows = results.map(result => [
      new Date().toISOString(),
      result.name || '',
      result.email || '',
      result.company || '',
      result.status || '',
      result.error || '',
      result.subject || '',
      result.sentAt || new Date().toISOString()
    ]);

    // Check if headers exist, if not add them
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:H1',
    });

    if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:H1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'Timestamp',
            'Recipient Name',
            'Email',
            'Company',
            'Status',
            'Error Message',
            'Subject',
            'Sent At'
          ]]
        }
      });
    }

    // Append the data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: rows
      }
    });

    return {
      success: true,
      updatedRows: response.data.updates.updatedRows
    };
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates a new spreadsheet and returns its ID
 */
export async function createSpreadsheet(config, title = 'Email Campaign Results') {
  try {
    const { serviceAccountEmail, privateKey } = config;

    const auth = new google.auth.JWT(
      serviceAccountEmail,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title
        },
        sheets: [{
          properties: {
            title: 'Sheet1'
          }
        }]
      }
    });

    return {
      success: true,
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetUrl: response.data.spreadsheetUrl
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
