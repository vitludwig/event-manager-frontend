import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';

describe('StorageService', () => {
	let service: StorageService;

	beforeEach(() => {
		localStorage.clear(); // @capacitor/preferences web impl is backed by localStorage
		TestBed.configureTestingModule({});
		service = TestBed.inject(StorageService);
	});

	afterEach(() => localStorage.clear());

	it('reads back what it wrote', async () => {
		await service.set('k', 'v');
		expect(await service.get('k')).toBe('v');
	});

	it('removes a key', async () => {
		await service.set('k', 'v');
		await service.remove('k');
		expect(await service.get('k')).toBeNull();
	});

	it('returns null for a missing key', async () => {
		expect(await service.get('missing')).toBeNull();
	});

	it('does not throw when the underlying store fails (e.g. QuotaExceededError)', async () => {
		spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
		// Caching is best-effort: a failure must never propagate to data rendering / socket handlers.
		await expectAsync(service.set('big', 'x'.repeat(10))).toBeResolved();
	});
});
