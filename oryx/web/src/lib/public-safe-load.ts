export async function safePublicLoad<T>(source: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[public:${source}] load failed`, error);
    return fallback;
  }
}
