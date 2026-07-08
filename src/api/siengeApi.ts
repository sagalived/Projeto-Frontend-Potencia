const SIENGE_SUBDOMAIN = import.meta.env.VITE_SIENGE_SUBDOMAIN || '';
const SIENGE_ACCESS_NAME = import.meta.env.VITE_SIENGE_ACCESS_NAME || '';
const SIENGE_TOKEN = import.meta.env.VITE_SIENGE_TOKEN || '';

const SIENGE_BASE_URL =
  import.meta.env.VITE_SIENGE_BASE_URL ||
  (SIENGE_SUBDOMAIN
    ? `https://api.sienge.com.br/${SIENGE_SUBDOMAIN}/public/api/v1`
    : '');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface SiengeRequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
}

function buildBasicAuthorization() {
  if (!SIENGE_ACCESS_NAME || !SIENGE_TOKEN) {
    throw new Error('Sienge credentials are not configured.');
  }

  return `Basic ${btoa(`${SIENGE_ACCESS_NAME}:${SIENGE_TOKEN}`)}`;
}

function buildUrl(path: string, query?: SiengeRequestOptions['query']) {
  if (!SIENGE_BASE_URL) {
    throw new Error('Sienge base URL is not configured. Define VITE_SIENGE_SUBDOMAIN or VITE_SIENGE_BASE_URL.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${SIENGE_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function siengeRequest<T = unknown>(
  path: string,
  options: SiengeRequestOptions = {},
): Promise<T> {
  const { method = 'GET', query, body, headers = {} } = options;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Authorization: buildBasicAuthorization(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(`Sienge API error (${response.status}): ${rawError}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export function siengeGet<T = unknown>(
  path: string,
  query?: SiengeRequestOptions['query'],
): Promise<T> {
  return siengeRequest<T>(path, { method: 'GET', query });
}

export function siengePost<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  return siengeRequest<T>(path, { method: 'POST', body });
}

export const siengeConfig = {
  subdomain: SIENGE_SUBDOMAIN,
  accessName: SIENGE_ACCESS_NAME,
  token: SIENGE_TOKEN,
  baseUrl: SIENGE_BASE_URL,
};
