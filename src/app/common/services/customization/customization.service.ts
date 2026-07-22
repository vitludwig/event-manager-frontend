import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../storage/storage.service';
import { retryWithBackoff } from '../../utils/retry-with-backoff';
const CUSTOMIZATION_CACHE_KEY = 'customization';
// Standalone marker of the festival the cached program data belongs to. Kept separate from the
// customization blob so we can compare "festival we last cached for" against the freshly fetched
// one and wipe stale program data when the backend switches to a new festival.
const FESTIVAL_ID_KEY = 'festivalId';

export interface IMapImage {
	name: string;
	value: string;
	valueEn?: string;
	labelCs?: string;
	labelEn?: string;
}

export interface ICustomization {
	themeCssUrl?: string;
	logoUrl?: string;
	faqUrlCs?: string;
	faqUrlEn?: string;
	configurableButtonIcon?: string;
	configurableButtonLabelCs?: string;
	configurableButtonLabelEn?: string;
	eventCardTagCount?: number | string;
	festivalId?: string;
	maps?: IMapImage[];
	competitionsInfo?: any[];
	tribesInfo?: any[];
	oneSignalAppId?: string;
	walletApiUrl?: string;
	/** Custom page title / PWA name. Empty or missing → app keeps its built-in default. */
	appName?: string;
	/** Uploaded favicon (relative /uploads path or absolute URL). Missing/unloadable → default favicon. */
	faviconUrl?: string;
}

@Injectable({
	providedIn: 'root'
})
export class CustomizationService {
	private readonly http = inject(HttpClient);
	private readonly storage = inject(StorageService);
	private readonly data = signal<ICustomization>({});
	private resolvedMaps: IMapImage[] = [];
	private resolvedMapsSource: IMapImage[] | undefined | null = null;
	private festivalChangeCb: (() => void | Promise<void>) | null = null;

	public get customization(): ICustomization {
		return this.data();
	}

	/**
	 * Register a callback fired when the freshly fetched festivalId differs from the one the
	 * cached program data belongs to. Wire this BEFORE calling load() so a cold start (which
	 * awaits the network) can also purge stale data. Only one consumer is expected.
	 */
	public onFestivalChange(cb: () => void | Promise<void>): void {
		this.festivalChangeCb = cb;
	}

	/**
	 * Stale-while-revalidate: render immediately from the durable cache and refresh
	 * from the network in the background. Only a cold start with no usable cache
	 * blocks on the network (otherwise the whole app would wait on a round-trip
	 * even when we already have data to show — costly on slow/unstable links).
	 */
	public async load(): Promise<void> {
		let hasValidCache = false;
		const cached = await this.storage.get(CUSTOMIZATION_CACHE_KEY);
		if (cached) {
			try {
				const parsed: ICustomization = JSON.parse(cached);
				this.data.set(parsed);
				hasValidCache = true;
				// Seed the festival marker for existing users upgrading to this build: their program
				// data was cached under parsed.festivalId, but the standalone marker doesn't exist yet.
				// Writing it now lets the upcoming network refresh detect a switch to a new festival.
				await this.seedFestivalMarkerIfMissing(parsed.festivalId);
			} catch {
				// A corrupt cache must not be trusted nor block the network fetch below.
				void this.storage.remove(CUSTOMIZATION_CACHE_KEY);
			}
		}

		if (hasValidCache) {
			// We already have something to show — don't block startup on the network,
			// and keep retrying in the background to converge on fresh data.
			void this.refreshFromNetwork(true);
		} else {
			// Cold start with nothing cached: a single bounded attempt (same as before).
			// Retrying here would hold the splash for the whole timeout+backoff window
			// on a slow/offline first launch.
			await this.refreshFromNetwork(false);
		}
	}

	private async refreshFromNetwork(withRetry: boolean): Promise<void> {
		try {
			const request$ = this.http
				.get<ICustomization>(`${environment.apiUrl}/public/customization`)
				.pipe(timeout(10_000));
			const result = await firstValueFrom(withRetry ? request$.pipe(retryWithBackoff()) : request$);
			this.data.set(result);
			void this.storage.set(CUSTOMIZATION_CACHE_KEY, JSON.stringify(result));
			await this.handleFestivalChange(result.festivalId);
		} catch (e) {
			console.error('Cannot load customization: ', e);
		}
	}

	private async seedFestivalMarkerIfMissing(festivalId: string | undefined): Promise<void> {
		if (!festivalId) {
			return;
		}
		const existing = await this.storage.get(FESTIVAL_ID_KEY);
		if (existing === null) {
			await this.storage.set(FESTIVAL_ID_KEY, festivalId);
		}
	}

	/**
	 * Compare the freshly fetched festival against the marker of the festival our cached program
	 * data belongs to. On a real switch, invoke the change callback (which purges + reloads the
	 * program) and then advance the marker. First run ever (no marker) just records the id — there
	 * is nothing stale to purge.
	 */
	private async handleFestivalChange(festivalId: string | undefined): Promise<void> {
		if (!festivalId) {
			return;
		}
		const previous = await this.storage.get(FESTIVAL_ID_KEY);
		if (previous === festivalId) {
			return;
		}
		if (previous !== null) {
			// A real switch: purge the previous festival's data BEFORE advancing the marker. If the
			// purge fails (e.g. offline, storage error), leave the marker so it is retried on the next
			// launch instead of stranding stale data under the new festival's id forever.
			try {
				await this.festivalChangeCb?.();
			} catch (e) {
				console.error('Festival change handler failed; keeping old marker to retry next launch: ', e);
				return;
			}
		}
		await this.storage.set(FESTIVAL_ID_KEY, festivalId);
	}

	private resolveUrl(path: string | undefined): string | undefined {
		// Guard against non-string values: the public payload is untrusted (a misconfigured/hostile
		// admin could store a number or object under a URL key), and path.startsWith would throw.
		if (typeof path !== 'string' || path === '') return undefined;
		if (path.startsWith('http') || path.startsWith('data:')) return path;
		return `${environment.apiUrl}${path}`;
	}

	public get themeCssUrl(): string | undefined {
		return this.resolveUrl(this.data().themeCssUrl);
	}

	public get logoUrl(): string | undefined {
		return this.resolveUrl(this.data().logoUrl);
	}

	public get appName(): string | undefined {
		// Untrusted payload: coerce anything non-string to undefined so consumers (appName.trim())
		// can never throw inside the app-identity effect.
		const value = this.data().appName;
		return typeof value === 'string' ? value : undefined;
	}

	public get faviconUrl(): string | undefined {
		// resolveUrl('') -> undefined, so an empty string collapses to "no custom favicon".
		return this.resolveUrl(this.data().faviconUrl);
	}

	public get faqUrlCs(): string | undefined {
		return this.data().faqUrlCs;
	}

	public get faqUrlEn(): string | undefined {
		return this.data().faqUrlEn;
	}

	public get configurableButtonIcon(): string | undefined {
		return this.data().configurableButtonIcon;
	}

	public get configurableButtonLabelCs(): string | undefined {
		return this.data().configurableButtonLabelCs;
	}

	public get configurableButtonLabelEn(): string | undefined {
		return this.data().configurableButtonLabelEn;
	}

	public get eventCardTagCount(): number | undefined {
		const raw = this.data().eventCardTagCount;
		// Guard "unset" BEFORE Number(): Number('') === 0 would otherwise hide all tags.
		if (raw === undefined || raw === null || raw === '') {
			return undefined;
		}
		const n = Number(raw);
		if (Number.isNaN(n) || n < 0) {
			return undefined;
		}
		return Math.floor(n);
	}

	public get festivalId(): string | undefined {
		return this.data().festivalId;
	}

	public get maps(): IMapImage[] {
		const source = this.data().maps;
		if (source !== this.resolvedMapsSource) {
			this.resolvedMapsSource = source;
			this.resolvedMaps = (source ?? []).map(m => ({
				name: m.name,
				value: this.resolveUrl(m.value) ?? m.value,
				// resolveUrl(undefined) is undefined, so valueEn stays absent when the backend omits it.
				valueEn: this.resolveUrl(m.valueEn) ?? m.valueEn,
				labelCs: m.labelCs,
				labelEn: m.labelEn,
			}));
		}
		return this.resolvedMaps;
	}

	public get competitionsInfo(): any[] | undefined {
		return this.data().competitionsInfo;
	}

	public get tribesInfo(): any[] | undefined {
		return this.data().tribesInfo;
	}

	public get oneSignalAppId(): string | undefined {
		return this.data().oneSignalAppId;
	}

	public get walletApiUrl(): string | undefined {
		return this.data().walletApiUrl;
	}
}
