import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';

import {NotificationService} from './notification.service';
import {CustomizationService} from '../../../../common/services/customization/customization.service';
import {environment} from '../../../../../environments/environment';

const EMPTY_NOTIFICATIONS = {
	notifications: [],
	limit: 50,
	offset: 0,
	total_count: 0,
};

const MIXED_NOTIFICATIONS = {
	notifications: [
		{
			id: 'n1',
			contents: {cs: 'Globální obsah', en: 'Global content'},
			headings: {cs: 'Globální', en: 'Global'},
			included_segments: ['Subscribed Users'],
		},
		{
			id: 'n2',
			contents: {cs: 'Příběh obsah', en: 'Story content'},
			headings: {cs: 'Příběh', en: 'Story'},
			included_segments: ['Story Subscribers'],
		},
		{
			id: 'n3',
			contents: {cs: 'Další globální', en: 'Another global'},
			headings: {cs: 'Další', en: 'Another'},
			included_segments: ['Subscribed Users'],
		},
	],
	limit: 50,
	offset: 0,
	total_count: 3,
};

describe('NotificationService', () => {
	let service: NotificationService;
	let httpTesting: HttpTestingController;

	const mockCustomizationService = {
		oneSignalAppId: undefined as string | undefined,
	};

	beforeEach(() => {
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{provide: CustomizationService, useValue: mockCustomizationService},
			],
		});

		httpTesting = TestBed.inject(HttpTestingController);
		service = TestBed.inject(NotificationService);

		// Flush the loadNotifications() call from constructor
		httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(EMPTY_NOTIFICATIONS);
	});

	afterEach(() => {
		httpTesting.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('story notifications subscription', () => {
		it('should default isSubscribedToStories to false (opt-in)', () => {
			expect(service.isSubscribedToStories()).toBeFalse();
		});

		it('should set isSubscribedToStories to true after subscribing', async () => {
			await service.subscribeToStories();
			expect(service.isSubscribedToStories()).toBeTrue();
		});

		it('should set isSubscribedToStories to false after unsubscribing', async () => {
			await service.subscribeToStories();
			expect(service.isSubscribedToStories()).toBeTrue();

			await service.unsubscribeFromStories();
			expect(service.isSubscribedToStories()).toBeFalse();
		});

		it('should persist subscription state in localStorage', async () => {
			await service.subscribeToStories();
			expect(localStorage.getItem('storyNotificationsEnabled')).toBe('true');

			await service.unsubscribeFromStories();
			expect(localStorage.getItem('storyNotificationsEnabled')).toBe('false');
		});

		it('should reflect subscribe state correctly after toggle cycle', async () => {
			expect(service.isSubscribedToStories()).toBeFalse();
			await service.subscribeToStories();
			expect(service.isSubscribedToStories()).toBeTrue();
			await service.unsubscribeFromStories();
			expect(service.isSubscribedToStories()).toBeFalse();
			await service.subscribeToStories();
			expect(service.isSubscribedToStories()).toBeTrue();
		});
	});

	describe('loadNotifications - filtering', () => {
		it('should filter out story notifications when not subscribed', fakeAsync(() => {
			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(MIXED_NOTIFICATIONS);
			tick();

			expect(service.notifications().length).toBe(2);
			expect(service.notifications().map(n => n.id)).toEqual(['n1', 'n3']);
		}));

		it('should show all notifications when subscribed to stories', fakeAsync(async () => {
			await service.subscribeToStories();

			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(MIXED_NOTIFICATIONS);
			tick();

			expect(service.notifications().length).toBe(3);
			expect(service.notifications().map(n => n.id)).toEqual(['n1', 'n2', 'n3']);
		}));

		it('should show only global notifications after unsubscribing', fakeAsync(async () => {
			await service.subscribeToStories();
			await service.unsubscribeFromStories();

			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(MIXED_NOTIFICATIONS);
			tick();

			expect(service.notifications().length).toBe(2);
			expect(service.notifications().every(
				n => !(n.included_segments ?? []).includes('Story Subscribers')
			)).toBeTrue();
		}));

		it('should handle notifications with undefined included_segments', fakeAsync(() => {
			const notificationsWithMissing = {
				notifications: [
					{
						id: 'n1',
						contents: {cs: 'Test'},
						headings: {cs: 'Test'},
						// included_segments is missing
					},
					{
						id: 'n2',
						contents: {cs: 'Story'},
						headings: {cs: 'Story'},
						included_segments: ['Story Subscribers'],
					},
				],
				limit: 50,
				offset: 0,
				total_count: 2,
			};

			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(notificationsWithMissing);
			tick();

			// Should not crash and should show notification without segments
			expect(service.notifications().length).toBe(1);
			expect(service.notifications()[0].id).toBe('n1');
		}));

		it('should handle notifications with multiple segments including Story Subscribers', fakeAsync(() => {
			const multiSegment = {
				notifications: [
					{
						id: 'n1',
						contents: {cs: 'Multi'},
						headings: {cs: 'Multi'},
						included_segments: ['Subscribed Users', 'Story Subscribers'],
					},
				],
				limit: 50,
				offset: 0,
				total_count: 1,
			};

			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(multiSegment);
			tick();

			// Should be filtered out when not subscribed
			expect(service.notifications().length).toBe(0);
		}));
	});

	describe('loadNotifications - error handling', () => {
		it('should keep notifications empty on HTTP error', fakeAsync(() => {
			service.loadNotifications();
			tick();

			httpTesting.expectOne(`${environment.apiUrl}/notification`).error(
				new ProgressEvent('error'), {status: 500}
			);
			tick();

			expect(service.notifications().length).toBe(0);
		}));

		it('should preserve existing notifications on subsequent HTTP error', fakeAsync(async () => {
			// First successful load
			service.loadNotifications();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/notification`).flush(MIXED_NOTIFICATIONS);
			tick();

			await service.subscribeToStories();
			const countBefore = service.notifications().length;

			// Second load fails
			service.loadNotifications();
			tick();
			httpTesting.expectOne(`${environment.apiUrl}/notification`).error(
				new ProgressEvent('error'), {status: 500}
			);
			tick();

			// Notifications remain from previous load
			expect(service.notifications().length).toBe(countBefore);
		}));
	});
});
