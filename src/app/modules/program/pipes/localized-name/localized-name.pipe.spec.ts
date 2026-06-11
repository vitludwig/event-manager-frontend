import {TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {LocalizedNamePipe} from './localized-name.pipe';

describe('LocalizedNamePipe', () => {
	function makePipe(lang: string | undefined): LocalizedNamePipe {
		TestBed.configureTestingModule({
			providers: [LocalizedNamePipe, {provide: TranslateService, useValue: {currentLang: lang}}],
		});
		return TestBed.inject(LocalizedNamePipe);
	}

	it('returns the Czech name when language is cs', () => {
		expect(makePipe('cs').transform({name: 'Hlavní', nameEn: 'Main'})).toBe('Hlavní');
	});

	it('returns nameEn when language is en', () => {
		expect(makePipe('en').transform({name: 'Hlavní', nameEn: 'Main'})).toBe('Main');
	});

	it('falls back to name when en but nameEn is null', () => {
		expect(makePipe('en').transform({name: 'Hlavní', nameEn: null})).toBe('Hlavní');
	});

	it('returns an empty string for null input', () => {
		expect(makePipe('en').transform(null)).toBe('');
	});

	it('returns an empty string for undefined input', () => {
		expect(makePipe('en').transform(undefined)).toBe('');
	});
});
