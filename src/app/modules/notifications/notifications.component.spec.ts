import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {NotificationsComponent} from './notifications.component';
import {NotificationService} from './services/notification/notification.service';
import {ProgramService} from '../program/services/program/program.service';

describe('NotificationsComponent', () => {
	let component: NotificationsComponent;
	let fixture: ComponentFixture<NotificationsComponent>;
	let mockNotificationService: any;

	beforeEach(() => {
		mockNotificationService = {
			notifications: signal([]),
			loadNotifications: jasmine.createSpy('loadNotifications').and.returnValue(Promise.resolve()),
			isSubscribedToStories: signal(false),
			subscribeToStories: jasmine.createSpy('subscribeToStories').and.returnValue(Promise.resolve()),
			unsubscribeFromStories: jasmine.createSpy('unsubscribeFromStories').and.returnValue(Promise.resolve()),
		};

		const mockProgramService = {
			events: signal([]),
			places: signal([]),
			days: signal({}),
			selectedDay: signal(undefined),
		};

		TestBed.configureTestingModule({
			imports: [NotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
			providers: [
				{provide: NotificationService, useValue: mockNotificationService},
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		fixture = TestBed.createComponent(NotificationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should call loadNotifications on init', () => {
		expect(mockNotificationService.loadNotifications).toHaveBeenCalled();
	});

	describe('story notifications toggle', () => {
		it('should call subscribeToStories when toggled on', async () => {
			await (component as any).onStoryToggle(true);
			expect(mockNotificationService.subscribeToStories).toHaveBeenCalled();
			expect(mockNotificationService.unsubscribeFromStories).not.toHaveBeenCalled();
		});

		it('should call unsubscribeFromStories when toggled off', async () => {
			await (component as any).onStoryToggle(false);
			expect(mockNotificationService.unsubscribeFromStories).toHaveBeenCalled();
			expect(mockNotificationService.subscribeToStories).not.toHaveBeenCalled();
		});

		it('should reload notifications after toggling on', async () => {
			mockNotificationService.loadNotifications.calls.reset();
			await (component as any).onStoryToggle(true);
			expect(mockNotificationService.loadNotifications).toHaveBeenCalledTimes(1);
		});

		it('should reload notifications after toggling off', async () => {
			mockNotificationService.loadNotifications.calls.reset();
			await (component as any).onStoryToggle(false);
			expect(mockNotificationService.loadNotifications).toHaveBeenCalledTimes(1);
		});
	});
});
