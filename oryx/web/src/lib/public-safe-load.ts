import { formatRuntimeError } from "@/lib/runtime-env";

export async function safePublicLoad<T>(source: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[public:${source}] load failed`, formatRuntimeError(error));
    return fallback;
  }
}
