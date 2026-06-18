import { TestBed } from '@angular/core/testing';

import { NetworkService } from './network.service';

describe('NetworkService', () => {
	let service: NetworkService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NetworkService);
	});

	it('reports connectivity from navigator.onLine on the web', async () => {
		await service.init();
		expect(await service.isConnected()).toBe(navigator.onLine);
	});

	it('updates the connected signal and notifies listeners on online/offline events', async () => {
		await service.init();

		const seen: boolean[] = [];
		service.addConnectedListener((connected) => seen.push(connected));

		window.dispatchEvent(new Event('offline'));
		expect(service.connected()).toBeFalse();

		window.dispatchEvent(new Event('online'));
		expect(service.connected()).toBeTrue();

		expect(seen).toEqual([false, true]);
	});
});
