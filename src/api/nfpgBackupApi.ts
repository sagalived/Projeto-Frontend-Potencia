export type NfpgDateRange = {
  startDate: string;
  endDate: string;
};

export type NfpgDataResponse = {
  source: string;
  startDate: string;
  endDate: string;
  total: number;
  generatedAt: string | null;
  lastSyncAt: string | null;
  items: Array<Record<string, unknown>>;
};

export type NfpgSyncResponse = {
  ok: boolean;
  endpointUsed: string;
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

export async function loadNfpgBackupData(range: NfpgDateRange): Promise<NfpgDataResponse> {
  const query = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  });

  const response = await fetch(`/api/nfpg/data?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  return parseJson<NfpgDataResponse>(response);
}

export async function syncNfpgBackup(): Promise<NfpgSyncResponse> {
  const response = await fetch('/api/nfpg/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trigger: 'manual' }),
  });

  return parseJson<NfpgSyncResponse>(response);
}
