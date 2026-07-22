import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppIdentityService } from './app-identity.service';
import { CustomizationService } from '../customization/customization.service';
import { StorageService } from '../storage/storage.service';
import { ICustomization } from '../customization/customization.service';
import { environment } from '../../../../environments/environment';

class FakeStorage {
	async get(): Promise<string | null> { return null; }
	async set(): Promise<void> {}
	async remove(): Promise<void> {}
}

/** Captures the last-constructed image so tests can drive its onload/onerror by hand. */
class FakeImage {
	public onload: (() => void) | null = null;
	public onerror: (() => void) | null = null;
	private _src = '';
	static last: FakeImage | null = null;
	set src(value: string) {
		this._src = value;
		FakeImage.last = this;
	}
	get src(): string { return this._src; }
}

describe('AppIdentityService', () => {
	let customization: CustomizationService;
	const DEFAULT_TITLE = 'DEFAULT TITLE';
	const DEFAULT_FAVICON = 'http://localhost:9876/default-favicon.ico';
	let faviconLink: HTMLLinkElement;
	let originalImage: typeof Image;

	function setCustomization(value: ICustomization): void {
		(customization as unknown as { data: { set(v: ICustomization): void } }).data.set(value);
		TestBed.tick();
	}

	beforeEach(() => {
		originalImage = window.Image;
		(window as unknown as { Image: unknown }).Image = FakeImage;
		FakeImage.last = null;

		// Seed the document with a known default title + favicon so the service captures them.
		document.title = DEFAULT_TITLE;
		document.querySelectorAll('link[rel~="icon"]').forEach((n) => n.remove());
		faviconLink = document.createElement('link');
		faviconLink.rel = 'icon';
		faviconLink.href = DEFAULT_FAVICON;
		document.head.appendChild(faviconLink);

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: StorageService, useClass: FakeStorage },
			],
		});

		customization = TestBed.inject(CustomizationService);
		// Instantiating the service captures the defaults above and wires the effect.
		TestBed.inject(AppIdentityService);
		TestBed.tick();
	});

	afterEach(() => {
		(window as unknown as { Image: typeof Image }).Image = originalImage;
		faviconLink.remove();
	});

	it('sets document.title from appName', () => {
		setCustomization({ appName: 'Roztočfest' });
		expect(document.title).toBe('Roztočfest');
	});

	it('falls back to the default title when appName is empty or missing', () => {
		setCustomization({ appName: 'Roztočfest' });
		expect(document.title).toBe('Roztočfest');

		setCustomization({ appName: '' });
		expect(document.title).toBe(DEFAULT_TITLE);

		setCustomization({});
		expect(document.title).toBe(DEFAULT_TITLE);
	});

	it('swaps the favicon once the image successfully loads', () => {
		setCustomization({ faviconUrl: '/uploads/icon.png' });

		const expected = `${environment.apiUrl}/uploads/icon.png`;
		// Not applied until the probe confirms the image loads.
		expect(faviconLink.href).toBe(DEFAULT_FAVICON);
		expect(FakeImage.last?.src).toBe(expected);

		FakeImage.last!.onload!();
		expect(faviconLink.href).toBe(expected);
	});

	it('keeps the default favicon when the image fails to load', () => {
		setCustomization({ faviconUrl: '/uploads/broken.png' });
		FakeImage.last!.onerror!();
		expect(faviconLink.href).toBe(DEFAULT_FAVICON);
	});

	it('restores the default favicon when faviconUrl is cleared', () => {
		setCustomization({ faviconUrl: '/uploads/icon.png' });
		FakeImage.last!.onload!();
		expect(faviconLink.href).toBe(`${environment.apiUrl}/uploads/icon.png`);

		setCustomization({ faviconUrl: '' });
		expect(faviconLink.href).toBe(DEFAULT_FAVICON);
	});
});
