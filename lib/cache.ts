const store = new Map<string, { at: number; ttl: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  shouldSave: (data: T) => boolean = () => true,
): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return Promise.resolve(hit.data as T);

  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  const task = load()
    .then((data) => {
      if (shouldSave(data)) store.set(key, { at: Date.now(), ttl: ttlMs, data });
      return data;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, task);
  return task;
}
