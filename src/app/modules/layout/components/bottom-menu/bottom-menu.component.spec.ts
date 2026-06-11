import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

import {BottomMenuComponent} from './bottom-menu.component';
import {SettingsService} from '../../../../common/services/settings/settings.service';
import {EDisplayDevice} from '../../../../common/types/EDisplayDevice';
import {CustomizationService} from '../../../../common/services/customization/customization.service';

describe('BottomMenuComponent', () => {
	let component: BottomMenuComponent;

	const mockSettingsService = {
		device: signal(EDisplayDevice.BASIC),
	};

	let mockCustomization: {
		faqUrlCs?: string;
		faqUrlEn?: string;
		configurableButtonIcon?: string;
	};

	function setup(): void {
		TestBed.configureTestingModule({
			imports: [BottomMenuComponent, RouterTestingModule, TranslateModule.forRoot()],
			providers: [
				{provide: SettingsService, useValue: mockSettingsService},
				{provide: CustomizationService, useValue: mockCustomization},
			],
		});

		const fixture = TestBed.createComponent(BottomMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	beforeEach(() => {
		mockCustomization = {};
	});

	it('should create', () => {
		setup();
		expect(component).toBeTruthy();
	});

	it('hides the configurable button when no URL is set', () => {
		mockCustomization = {};
		setup();
		expect((component as any).showConfigurableButton).toBeFalse();
	});

	it('shows the configurable button with the configured icon when URL and icon are set', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help', configurableButtonIcon: 'info'};
		setup();
		expect((component as any).showConfigurableButton).toBeTrue();
		expect((component as any).configurableButtonIcon).toBe('info');
	});

	it('falls back to the help icon when URL is set but icon is missing', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help'};
		setup();
		expect((component as any).showConfigurableButton).toBeTrue();
		expect((component as any).configurableButtonIcon).toBe('help');
	});

	it('opens the configured URL in a new tab with noopener,noreferrer on click', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help'};
		setup();
		const openSpy = spyOn(window, 'open');
		(component as any).openConfigurableButton();
		expect(openSpy).toHaveBeenCalledWith('https://example.test/help', '_blank', 'noopener,noreferrer');
	});

	it('uses the Czech URL when language is cs', () => {
		mockCustomization = {faqUrlCs: 'https://example.test/cs', faqUrlEn: 'https://example.test/en'};
		setup();
		(TestBed.inject(TranslateService) as any).currentLang = 'cs';
		const openSpy = spyOn(window, 'open');
		(component as any).openConfigurableButton();
		expect(openSpy).toHaveBeenCalledWith('https://example.test/cs', '_blank', 'noopener,noreferrer');
	});

	it('falls back to the other language URL when the current language has none', () => {
		mockCustomization = {faqUrlCs: 'https://example.test/cs'}; // only CS configured
		setup();
		(TestBed.inject(TranslateService) as any).currentLang = 'en'; // English user
		expect((component as any).showConfigurableButton).toBeTrue();
		expect((component as any).configurableButtonUrl).toBe('https://example.test/cs');
	});
});
