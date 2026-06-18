import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Durable key-value cache, backed by @capacitor/preferences (native: SharedPreferences /
 * UserDefaults; web: localStorage under the hood). This is the SINGLE source of truth for
 * the offline cache — we intentionally do not mirror into localStorage, so the two can't
 * diverge. Unlike WebView localStorage, Preferences survives OS storage eviction.
 *
 * The API is async (Preferences is async on native). All calls are error-safe: caching is
 * best-effort and must never throw into data rendering or websocket handlers.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
	public async get(key: string): Promise<string | null> {
		try {
			const { value } = await Preferences.get({ key });
			return value ?? null;
		} catch (e) {
			console.error(`StorageService: failed to read "${key}"`, e);
			return null;
		}
	}

	public async set(key: string, value: string): Promise<void> {
		try {
			await Preferences.set({ key, value });
		} catch (e) {
			console.error(`StorageService: failed to persist "${key}"`, e);
		}
	}

	public async remove(key: string): Promise<void> {
		try {
			await Preferences.remove({ key });
		} catch (e) {
			console.error(`StorageService: failed to remove "${key}"`, e);
		}
	}
}
