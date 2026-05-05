const LOCALE_PATH_PATTERN = /^\/(zh|en)(\/|$)/

function resolveLocaleFromPath(pathname: string): string {
  const match = pathname.match(LOCALE_PATH_PATTERN)
  return match?.[1] ?? 'zh'
}

export function getPageLocale(): string {
  if (typeof window === 'undefined') return 'zh'
  return resolveLocaleFromPath(window.location.pathname)
}

function resolveRequestPathname(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    if (input.startsWith('/')) return input
    try {
      return new URL(input).pathname
    } catch {
      return ''
    }
  }

  if (input instanceof URL) {
    return input.pathname
  }

  try {
    return new URL(input.url).pathname
  } catch {
    return ''
  }
}

function shouldInjectLocaleHeader(input: RequestInfo | URL): boolean {
  const pathname = resolveRequestPathname(input)
  return pathname === '/api' || pathname.startsWith('/api/')
}

export function mergeLocaleHeader(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getPageLocale())
  }
  return { ...init, headers }
}

// 这一行是关键！所有请求直接发到你的后端服务器
const API_BASE_URL = "https://api.aivideoly.com";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = input;

  // 自动拼接完整后端地址
  if (typeof url === "string" && url.startsWith("/api")) {
    url = API_BASE_URL + url;
  }

  if (!shouldInjectLocaleHeader(url)) {
    return fetch(url, init);
  }
  
  return fetch(url, mergeLocaleHeader(init));
}
