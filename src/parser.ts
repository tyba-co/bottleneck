export const load = <T extends Record<string, any>>(received: any, defaults: T, onto: any = {}): T => {
  for (const k in defaults) {
    onto[k] = received[k] != null ? received[k] : defaults[k];
  }
  return onto;
};

export const overwrite = <T extends Record<string, any>>(received: any, defaults: T, onto: any = {}): Partial<T> => {
  for (const k in received) {
    if (defaults[k] !== undefined) {
      onto[k] = received[k];
    }
  }
  return onto;
};
