import {TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

import {SettingsService} from './settings.service';
import {EDisplayDevice} from '../../types/EDisplayDevice';

describe('SettingsService', () => {
	let service: SettingsService;
	let queryParams$: BehaviorSubject<Record<string, string>>;

	beforeEach(() => {
		queryParams$ = new BehaviorSubject<Record<string, string>>({});

		TestBed.configureTestingModule({
			providers: [
				{provide: ActivatedRoute, useValue: {queryParams: queryParams$}},
			],
		});
		service = TestBed.inject(SettingsService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should default device to BASIC', () => {
		expect(service.device()).toBe(EDisplayDevice.BASIC);
	});

	it('should read device from query params', () => {
		queryParams$.next({display: EDisplayDevice.INFO_PANEL});
		expect(service.device()).toBe(EDisplayDevice.INFO_PANEL);
	});

	it('should fall back to BASIC when display param is absent', () => {
		queryParams$.next({other: 'value'});
		expect(service.device()).toBe(EDisplayDevice.BASIC);
	});

	it('should update reactively when query params change', () => {
		queryParams$.next({display: EDisplayDevice.INFO_PANEL});
		expect(service.device()).toBe(EDisplayDevice.INFO_PANEL);

		queryParams$.next({display: EDisplayDevice.BASIC});
		expect(service.device()).toBe(EDisplayDevice.BASIC);
	});
});
