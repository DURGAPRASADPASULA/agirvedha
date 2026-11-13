import type {
  CalendarEventSummary,
  DriveFileSummary,
  GmailMessageSummary,
  SheetPreviewData,
} from '../types/agri';

async function workspaceFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Google Workspace API error (${res.status}): ${errText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ==================== GOOGLE DRIVE ==================== */

export async function listDriveFiles(
  accessToken: string,
  searchQuery = ''
): Promise<DriveFileSummary[]> {
  const qParts = ['trashed = false'];
  if (searchQuery.trim()) {
    const safe = searchQuery.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${safe}'`);
  }
  const params = new URLSearchParams({
    pageSize: '12',
    orderBy: 'modifiedTime desc',
    q: qParts.join(' and '),
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
  });

  const data = await workspaceFetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    accessToken
  );
  return (data?.files ?? []) as DriveFileSummary[];
}

export async function uploadTextReportToDrive(
  accessToken: string,
  fileName: string,
  content: string
): Promise<DriveFileSummary> {
  const boundary = 'agriveda_multipart_boundary';
  const metadata = JSON.stringify({
    name: fileName,
    mimeType: 'text/plain',
  });

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const data = await workspaceFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink',
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );
  return data as DriveFileSummary;
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  await workspaceFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}

/* ==================== GOOGLE SHEETS ==================== */

export async function createFarmSpreadsheet(
  accessToken: string,
  title: string,
  tabName: string,
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const created = await workspaceFetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: tabName } }],
      }),
    }
  );

  const spreadsheetId = created.spreadsheetId as string;
  const spreadsheetUrl = created.spreadsheetUrl as string;

  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(`${tabName}!A1`)}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

export async function readSpreadsheetPreview(
  accessToken: string,
  spreadsheetId: string
): Promise<SheetPreviewData> {
  // Always inspect metadata first to avoid hardcoding "Sheet1"
  const meta = await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=properties.title,sheets.properties.title`,
    accessToken
  );

  const title = (meta?.properties?.title as string) || 'Spreadsheet';
  const sheetTabs: string[] = (meta?.sheets ?? [])
    .map((s: { properties?: { title?: string } }) => s.properties?.title)
    .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0);

  const activeTab = sheetTabs[0] || 'Sheet1';
  const valuesRes = await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(`${activeTab}!A1:G25`)}`,
    accessToken
  );

  return {
    spreadsheetId,
    title,
    sheetTabs,
    activeTab,
    rows: (valuesRes?.values ?? []) as string[][],
  };
}

/* ==================== GMAIL ==================== */

export async function listRecentGmailMessages(
  accessToken: string,
  maxResults = 6
): Promise<GmailMessageSummary[]> {
  const listRes = await workspaceFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    accessToken
  );
  const refs: { id: string }[] = listRes?.messages ?? [];
  if (refs.length === 0) return [];

  const details = await Promise.all(
    refs.slice(0, maxResults).map(async (m) => {
      const msg = await workspaceFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
          m.id
        )}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        accessToken
      );
      const headers: { name: string; value: string }[] = msg?.payload?.headers ?? [];
      const findHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

      return {
        id: m.id,
        subject: findHeader('Subject') || '(No subject)',
        from: findHeader('From') || 'Unknown sender',
        date: findHeader('Date') || '',
        snippet: msg?.snippet ?? '',
      } as GmailMessageSummary;
    })
  );

  return details;
}

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendGmailMessage(
  accessToken: string,
  toEmail: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  const rawMime = [
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ].join('\r\n');

  const raw = encodeBase64UrlUtf8(rawMime);
  const res = await workspaceFetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    }
  );
  return { id: res.id as string };
}

/* ==================== GOOGLE CALENDAR ==================== */

export async function listUpcomingCalendarEvents(
  accessToken: string,
  maxResults = 8
): Promise<CalendarEventSummary[]> {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  });

  const data = await workspaceFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    accessToken
  );

  return (data?.items ?? []).map(
    (ev: {
      id: string;
      summary?: string;
      description?: string;
      htmlLink?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }) => ({
      id: ev.id,
      summary: ev.summary || '(Untitled farm reminder)',
      start: ev.start?.dateTime || ev.start?.date || '',
      end: ev.end?.dateTime || ev.end?.date || '',
      description: ev.description,
      htmlLink: ev.htmlLink,
    })
  );
}

export async function createCalendarEvent(
  accessToken: string,
  summary: string,
  description: string,
  dateIso: string
): Promise<CalendarEventSummary> {
  // Schedule 08:00 AM - 09:00 AM IST (+05:30)
  const startDateTime = `${dateIso}T08:00:00+05:30`;
  const endDateTime = `${dateIso}T09:00:00+05:30`;

  const created = await workspaceFetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
      }),
    }
  );

  return {
    id: created.id,
    summary: created.summary,
    start: created.start?.dateTime || startDateTime,
    end: created.end?.dateTime || endDateTime,
    description: created.description,
    htmlLink: created.htmlLink,
  };
}
