import { google } from 'googleapis';
import { ContactInfo } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

export async function logContactToSheet(contact: ContactInfo): Promise<void> {
  console.log('📊 Logging contact to Google Sheets...');

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = process.env.SHEET_ID;
  if (!spreadsheetId) throw new Error('SHEET_ID not set');

  const values = [[
    contact.timestamp,
    contact.name,
    contact.email,
    contact.organization,
    contact.question
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:E', // Timestamp, Name, Email, Organization, Question
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  console.log('✅ Contact logged successfully');
}