import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';

import {CustomizationService} from './customization.service';
import {environment} from '../../../../environments/environment';

describe('CustomizationService', () => {
	let service: CustomizationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()],
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
		it('still fetches from the network when the localStorage cache is corrupt', async () => {
			spyOn(localStorage, 'getItem').and.returnValue('not-valid-json{');
			spyOn(localStorage, 'setItem');
			spyOn(localStorage, 'removeItem');
			const httpTesting = TestBed.inject(HttpTestingController);

			const loadPromise = service.load();
			const req = httpTesting.expectOne(`${environment.apiUrl}/public/customization`);
			req.flush({eventCardTagCount: '3'});
			await loadPromise;

			expect(service.eventCardTagCount).toBe(3);
			httpTesting.verify();
		});
	});
});
