import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

import {MapComponent} from './map.component';
import {CustomizationService} from '../../common/services/customization/customization.service';

describe('MapComponent', () => {
	let component: MapComponent;
	let fixture: ComponentFixture<MapComponent>;
	let translate: TranslateService;

	const mockCustomization = {
		maps: [
			{name: 'map1', value: 'u1', labelCs: 'Hlavní mapa', labelEn: 'Main map'},
			{name: 'map2', value: 'u2', labelCs: '', labelEn: 'Comp map'},
			{name: 'map3', value: '', labelCs: '', labelEn: ''},
		],
		competitionsInfo: undefined,
		tribesInfo: undefined,
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapComponent, TranslateModule.forRoot()],
			providers: [
				{provide: CustomizationService, useValue: mockCustomization},
			],
		});
		fixture = TestBed.createComponent(MapComponent);
		component = fixture.componentInstance;
		translate = TestBed.inject(TranslateService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('returns the CS label when language is cs', () => {
		translate.use('cs');
		expect((component as any).festivalMapLabel).toBe('Hlavní mapa');
	});

	it('returns the EN label when language is en', () => {
		translate.use('en');
		expect((component as any).festivalMapLabel).toBe('Main map');
	});

	it('falls back to the other language when the current-language label is empty', () => {
		translate.use('cs');
		expect((component as any).competitionMapLabel).toBe('Comp map');
	});

	it('falls back to "Mapa" when both labels are empty', () => {
		translate.use('cs');
		expect((component as any).tribesMapLabel).toBe('Mapa');
	});

	it('returns the map value by name', () => {
		expect((component as any).festivalMap).toBe('u1');
		expect((component as any).competitionMap).toBe('u2');
		expect((component as any).tribesMap).toBe('');
	});

	describe('info normalization', () => {
		afterEach(() => {
			mockCustomization.competitionsInfo = undefined;
			mockCustomization.tribesInfo = undefined;
		});

		it('treats an empty competitionsInfo array as no info', () => {
			(mockCustomization as any).competitionsInfo = [];
			expect((component as any).competitionsInfo).toBeUndefined();
		});

		it('returns competitionsInfo when it has items', () => {
			(mockCustomization as any).competitionsInfo = [{title: 'x'}];
			expect((component as any).competitionsInfo).toEqual([{title: 'x'}]);
		});

		it('treats an empty tribesInfo array as no info', () => {
			(mockCustomization as any).tribesInfo = [];
			expect((component as any).tribesInfo).toBeUndefined();
		});

		it('returns tribesInfo when it has items', () => {
			(mockCustomization as any).tribesInfo = [{title: 'y'}];
			expect((component as any).tribesInfo).toEqual([{title: 'y'}]);
		});
	});

	describe('localized map value (value / valueEn)', () => {
		const originalMaps = mockCustomization.maps;
		afterEach(() => {
			(mockCustomization as any).maps = originalMaps;
		});

		it('uses valueEn in English when present', () => {
			(mockCustomization as any).maps = [{name: 'map1', value: 'cs.png', valueEn: 'en.png'}];
			translate.use('en');
			expect((component as any).festivalMap).toBe('en.png');
		});

		it('uses value in Czech even when valueEn is present', () => {
			(mockCustomization as any).maps = [{name: 'map1', value: 'cs.png', valueEn: 'en.png'}];
			translate.use('cs');
			expect((component as any).festivalMap).toBe('cs.png');
		});

		it('falls back to value in English when valueEn is absent', () => {
			(mockCustomization as any).maps = [{name: 'map1', value: 'cs.png'}];
			translate.use('en');
			expect((component as any).festivalMap).toBe('cs.png');
		});

		it('falls back to value in English when valueEn is an empty string', () => {
			(mockCustomization as any).maps = [{name: 'map1', value: 'cs.png', valueEn: ''}];
			translate.use('en');
			expect((component as any).festivalMap).toBe('cs.png');
		});
	});

	describe('map3 with a customization label but no map value', () => {
		const originalMaps = mockCustomization.maps;
		afterEach(() => {
			(mockCustomization as any).maps = originalMaps;
			(mockCustomization as any).tribesInfo = undefined;
			(mockCustomization as any).competitionsInfo = undefined;
		});

		it('renders the tribes tab with its customization label even when value is empty (CS)', () => {
			(mockCustomization as any).maps = [{name: 'map3', value: '', labelCs: 'Kmeny', labelEn: 'Tribes'}];
			(mockCustomization as any).tribesInfo = [{tribeName: 'Kmen A'}];
			(mockCustomization as any).competitionsInfo = undefined;
			translate.use('cs');
			fixture.detectChanges();

			// Label resolves from customization (map3) despite the empty value...
			expect((component as any).tribesMapLabel).toBe('Kmeny');
			// ...and the empty value means no map link → no broken "Mapa" sub-tab.
			expect((component as any).tribesMap).toBeFalsy();

			// The tribes tab header is actually rendered with the customization label.
			const tabTexts = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'))
				.map((el) => ((el as HTMLElement).textContent || '').trim());
			expect(tabTexts).toContain('Kmeny');
		});

		it('uses the English customization label when language is en', () => {
			(mockCustomization as any).maps = [{name: 'map3', value: '', labelCs: 'Kmeny', labelEn: 'Tribes'}];
			(mockCustomization as any).tribesInfo = [{tribeName: 'Tribe A'}];
			translate.use('en');
			expect((component as any).tribesMapLabel).toBe('Tribes');
			expect((component as any).tribesMap).toBeFalsy();
		});
	});
});
