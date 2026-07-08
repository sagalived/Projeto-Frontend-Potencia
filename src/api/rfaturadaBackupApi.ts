export type RfaturadaDateRange = {
  startDate: string;
  endDate: string;
};

export type RfaturadaDataResponse = {
  source: string;
  startDate: string;
  endDate: string;
  total: number;
  generatedAt: string | null;
  lastSyncAt: string | null;
  items: Array<Record<string, unknown>>;
};

export type RfaturadaSyncResponse = {
  ok: boolean;
  endpointUsed: string;
  queryUsed?: Record<string, string>;
  total: number;
  fetchedInWindow: number;
  incrementalWindow: { startDate: string; endDate: string };
  lastSyncAt: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof (payload as { message?: unknown }).message === 'string'
        ? String((payload as { message: string }).message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function loadRfaturadaBackupData(range: RfaturadaDateRange): Promise<RfaturadaDataResponse> {
  const query = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  });

  const response = await fetch(`/api/rfaturada/data?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  return parseJson<RfaturadaDataResponse>(response);
}

export async function syncRfaturadaBackup(): Promise<RfaturadaSyncResponse> {
  const response = await fetch('/api/rfaturada/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trigger: 'manual' }),
  });

  return parseJson<RfaturadaSyncResponse>(response);
}
