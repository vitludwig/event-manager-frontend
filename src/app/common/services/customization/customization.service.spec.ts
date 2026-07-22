import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';

import {CustomizationService} from './customization.service';
import {StorageService} from '../storage/storage.service';
import {environment} from '../../../../environments/environment';

/** In-memory StorageService stub so tests don't depend on the Preferences/localStorage backend. */
class FakeStorage {
	private readonly map = new Map<string, string>();
	seed(key: string, value: string): void { this.map.set(key, value); }
	async get(key: string): Promise<string | null> { return this.map.has(key) ? this.map.get(key)! : null; }
	async set(key: string, value: string): Promise<void> { this.map.set(key, value); }
	async remove(key: string): Promise<void> { this.map.delete(key); }
}

describe('CustomizationService', () => {
	let service: CustomizationService;
	let storage: FakeStorage;

	beforeEach(() => {
		storage = new FakeStorage();
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{provide: StorageService, useValue: storage},
			],
		});
		service = TestBed.inject(CustomizationService);
	});

	it('keeps labelCs/labelEn on map entries', () => {
		(service as any).data.set({
			maps: [{name: 'map1', value: 'https://x.test/p.png', labelCs: 'CS', labelEn: 'EN'}],
		});

		const maps = service.maps;
		expect(maps[0].name).toBe('map1');
		expect(maps[0].value).toBe('https://x.test/p.png');
		expect(maps[0].labelCs).toBe('CS');
		expect(maps[0].labelEn).toBe('EN');
	});

	it('resolves and keeps valueEn on map entries when present', () => {
		(service as any).data.set({
			maps: [{name: 'map1', value: '/cs.png', valueEn: '/en.png'}],
		});

		const maps = service.maps;
		expect(maps[0].value).toBe(`${environment.apiUrl}/cs.png`);
		expect(maps[0].valueEn).toBe(`${environment.apiUrl}/en.png`);
	});

	it('leaves valueEn undefined when the backend omits it', () => {
		(service as any).data.set({
			maps: [{name: 'map1', value: 'https://x.test/p.png'}],
		});

		const maps = service.maps;
		expect(maps[0].value).toBe('https://x.test/p.png');
		expect(maps[0].valueEn).toBeUndefined();
	});

	describe('eventCardTagCount', () => {
		it('returns undefined when unset', () => {
			(service as any).data.set({});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('returns undefined for an empty string', () => {
			(service as any).data.set({eventCardTagCount: ''});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('parses a numeric string', () => {
			(service as any).data.set({eventCardTagCount: '3'});
			expect(service.eventCardTagCount).toBe(3);
		});

		it('treats 0 as a valid value', () => {
			(service as any).data.set({eventCardTagCount: '0'});
			expect(service.eventCardTagCount).toBe(0);
		});

		it('returns undefined for negative values', () => {
			(service as any).data.set({eventCardTagCount: '-2'});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('returns undefined for non-numeric values', () => {
			(service as any).data.set({eventCardTagCount: 'abc'});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('floors a fractional number', () => {
			(service as any).data.set({eventCardTagCount: 2.7});
			expect(service.eventCardTagCount).toBe(2);
		});
	});

	describe('load', () => {
		it('renders from cache immediately and refreshes in the background (does not block on the network)', fakeAsync(() => {
			storage.seed('customization', JSON.stringify({festivalId: 'cached'}));
			const httpTesting = TestBed.inject(HttpTestingController);

			let resolved = false;
			service.load().then(() => (resolved = true));
			tick();

			// load() resolved without waiting for the network because we had a valid cache.
			expect(resolved).toBeTrue();
			expect(service.festivalId).toBe('cached');

			// The background refresh still runs and updates the data when it arrives.
			httpTesting.expectOne(`${environment.apiUrl}/public/customization`).flush({festivalId: 'fresh'});
			tick();
			expect(service.festivalId).toBe('fresh');

			httpTesting.verify();
		}));

		it('still fetches from the network when the cache is corrupt', fakeAsync(() => {
			storage.seed('customization', 'not-valid-json{');
			const httpTesting = TestBed.inject(HttpTestingController);

			service.load();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/public/customization`).flush({eventCardTagCount: '3'});
			tick();

			expect(service.eventCardTagCount).toBe(3);
			httpTesting.verify();
		}));
	});

	describe('festival change', () => {
		it('fires the callback and purges when the fetched festivalId differs from the cached one', fakeAsync(() => {
			storage.seed('customization', JSON.stringify({festivalId: 'old'}));
			const httpTesting = TestBed.inject(HttpTestingController);
			const onChange = jasmine.createSpy('onFestivalChange');
			service.onFestivalChange(onChange);

			service.load();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/public/customization`).flush({festivalId: 'new'});
			tick();

			expect(onChange).toHaveBeenCalledTimes(1);
			// Marker advanced to the new festival so it isn't purged again on the next refresh.
			storage.get('festivalId').then((v) => expect(v).toBe('new'));
			tick();
			httpTesting.verify();
		}));

		it('does not fire when the festivalId is unchanged', fakeAsync(() => {
			storage.seed('customization', JSON.stringify({festivalId: 'same'}));
			const httpTesting = TestBed.inject(HttpTestingController);
			const onChange = jasmine.createSpy('onFestivalChange');
			service.onFestivalChange(onChange);

			service.load();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/public/customization`).flush({festivalId: 'same'});
			tick();

			expect(onChange).not.toHaveBeenCalled();
			httpTesting.verify();
		}));

		it('does not fire on a first-ever run (no prior marker)', fakeAsync(() => {
			const httpTesting = TestBed.inject(HttpTestingController);
			const onChange = jasmine.createSpy('onFestivalChange');
			service.onFestivalChange(onChange);

			service.load();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/public/customization`).flush({festivalId: 'first'});
			tick();

			expect(onChange).not.toHaveBeenCalled();
			storage.get('festivalId').then((v) => expect(v).toBe('first'));
			tick();
			httpTesting.verify();
		}));
	});
});
