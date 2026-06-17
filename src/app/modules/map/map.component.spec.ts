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
});
