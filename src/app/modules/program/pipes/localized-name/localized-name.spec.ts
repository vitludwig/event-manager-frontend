import {localizedName} from './localized-name';

describe('localizedName', () => {
	it('returns name when language is not en', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, 'cs')).toBe('Hlavní stage');
	});

	it('returns name when language is undefined (default)', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, undefined)).toBe('Hlavní stage');
	});

	it('returns nameEn when language is en and nameEn is set', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, 'en')).toBe('Main stage');
	});

	it('falls back to name when language is en but nameEn is empty', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: ''}, 'en')).toBe('Hlavní stage');
	});

	it('falls back to name when language is en but nameEn is null', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: null}, 'en')).toBe('Hlavní stage');
	});

	it('falls back to name when nameEn is undefined', () => {
		expect(localizedName({name: 'Hlavní stage'}, 'en')).toBe('Hlavní stage');
	});
});
