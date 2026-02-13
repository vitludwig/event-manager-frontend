import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateModule} from '@ngx-translate/core';

import {BottomMenuComponent} from './bottom-menu.component';
import {SettingsService} from '../../../../common/services/settings/settings.service';
import {EDisplayDevice} from '../../../../common/types/EDisplayDevice';

describe('BottomMenuComponent', () => {
	let component: BottomMenuComponent;

	const mockSettingsService = {
		device: signal(EDisplayDevice.BASIC),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BottomMenuComponent, RouterTestingModule, TranslateModule.forRoot()],
			providers: [
				{provide: SettingsService, useValue: mockSettingsService},
			],
		});

		const fixture = TestBed.createComponent(BottomMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
