import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {CustomizationService} from './customization.service';

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
});
