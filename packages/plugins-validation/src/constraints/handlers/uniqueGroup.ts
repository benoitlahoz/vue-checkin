// ...existing code...

export function uniqueGroupHandler<T>(
  keys: (keyof T)[],
  data: T,
  children: T[],
  message?: string
): string | null {
  if (children.some((child: T) => keys.every((k) => child[k] === data[k]))) {
    return message || `Combination of ${keys.join('+')} must be unique.`;
  }
  return null;
}
