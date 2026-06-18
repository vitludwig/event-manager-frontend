import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * Connectivity state, reliable inside a Capacitor WebView.
 *
 * `window.navigator.onLine` is unreliable on native (it often reports stale or
 * always-true values in WKWebView/Android WebView), so on native we use the
 * @capacitor/network plugin. On the web we fall back to `navigator.onLine` plus
 * the window online/offline events.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
	private readonly ngZone = inject(NgZone);
	private readonly _connected = signal<boolean>(true);
	/** Last known connectivity state (reactive). */
	public readonly connected = this._connected.asReadonly();

	private initialized = false;
	private readonly listeners = new Set<(connected: boolean) => void>();

	private get isNative(): boolean {
		return Capacitor.isNativePlatform();
	}

	/** Wire up platform connectivity listeners. Idempotent. */
	public async init(): Promise<void> {
		if (this.initialized) {
			return;
		}
		this.initialized = true;

		if (this.isNative) {
			try {
				const status = await Network.getStatus();
				this.update(status.connected);
				Network.addListener('networkStatusChange', (status) => this.update(status.connected));
			} catch (e) {
				console.error('NetworkService: failed to init native network listener', e);
			}
		} else {
			this.update(navigator.onLine);
			window.addEventListener('online', () => this.update(true));
			window.addEventListener('offline', () => this.update(false));
		}
	}

	/** Current connectivity, queried fresh. */
	public async isConnected(): Promise<boolean> {
		if (this.isNative) {
			try {
				return (await Network.getStatus()).connected;
			} catch {
				return this._connected();
			}
		}
		return navigator.onLine;
	}

	/** Register a callback fired whenever connectivity changes. */
	public addConnectedListener(callback: (connected: boolean) => void): void {
		this.listeners.add(callback);
	}

	private update(connected: boolean): void {
		// Native plugin callbacks fire outside Angular's zone; re-enter it so signal
		// writes (and listener-driven work like a data refresh) trigger change detection.
		this.ngZone.run(() => {
			this._connected.set(connected);
			for (const listener of this.listeners) {
				listener(connected);
			}
		});
	}
}
