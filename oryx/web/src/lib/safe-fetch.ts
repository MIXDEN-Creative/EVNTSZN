export async function safeFetch<T = any>(
  input: RequestInfo,
  init?: RequestInit,
  fallback: T = [] as T
): Promise<T> {
  try {
    const res = await fetch(input, init)

    if (!res.ok) {
      console.error('[safeFetch] non-OK response', res.status)
      return fallback
    }

    return await res.json()
  } catch (err) {
    console.error('[safeFetch] fetch failed', err)
    return fallback
  }
}
