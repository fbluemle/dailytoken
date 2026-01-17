import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin wrapper around AsyncStorage used by the app.
// Provides JSON helpers and scoped helpers for the daily-token cache.

const DAILY_TOKEN_KEY = 'dailytoken.cache.v1';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {[key: string]: JsonValue};

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (_) {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (_) {
      // no-op
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (_) {
      // no-op
    }
  },
  async getJson<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (_) {
      return null;
    }
  },
  async setJson(key: string, value: unknown): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      await this.setItem(key, raw);
    } catch (_) {
      // no-op
    }
  },
};

export type DailyTokenCache<TToken = unknown> = {
  utcDate: string;
  token: TToken;
  storedAt: number;
};

export async function loadDailyTokenCache<
  TToken = unknown,
>(): Promise<DailyTokenCache<TToken> | null> {
  return Storage.getJson<DailyTokenCache<TToken>>(DAILY_TOKEN_KEY);
}

export async function saveDailyTokenCache<TToken = unknown>(
  payload: DailyTokenCache<TToken>,
): Promise<void> {
  await Storage.setJson(DAILY_TOKEN_KEY, payload);
}

export async function clearDailyTokenCache(): Promise<void> {
  await Storage.removeItem(DAILY_TOKEN_KEY);
}

export const Keys = {
  DAILY_TOKEN_KEY,
};
