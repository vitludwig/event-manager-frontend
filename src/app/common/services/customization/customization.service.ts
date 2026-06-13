import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface IMapImage {
	name: string;
	value: string;
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
}

@Injectable({
	providedIn: 'root'
})
export class CustomizationService {
	private readonly http = inject(HttpClient);
	private readonly data = signal<ICustomization>({});
	private resolvedMaps: IMapImage[] = [];
	private resolvedMapsSource: IMapImage[] | undefined | null = null;

	public get customization(): ICustomization {
		return this.data();
	}

	public async load(): Promise<void> {
		try {
			const cached = localStorage.getItem('customization');
			if (cached) {
				try {
					this.data.set(JSON.parse(cached));
				} catch {
					// A corrupt cache must not block the network fetch below.
					localStorage.removeItem('customization');
				}
			}

			const result = await firstValueFrom(
				this.http.get<ICustomization>(`${environment.apiUrl}/public/customization`).pipe(
					timeout(10_000)
				)
			);
			this.data.set(result);
			localStorage.setItem('customization', JSON.stringify(result));
		} catch (e) {
			console.error('Cannot load customization: ', e);
		}
	}

	private resolveUrl(path: string | undefined): string | undefined {
		if (!path) return undefined;
		if (path.startsWith('http') || path.startsWith('data:')) return path;
		return `${environment.apiUrl}${path}`;
	}

	public get themeCssUrl(): string | undefined {
		return this.resolveUrl(this.data().themeCssUrl);
	}

	public get logoUrl(): string | undefined {
		return this.resolveUrl(this.data().logoUrl);
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
