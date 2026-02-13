import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {NotificationsComponent} from './notifications.component';
import {NotificationService} from './services/notification/notification.service';
import {ProgramService} from '../program/services/program/program.service';

describe('NotificationsComponent', () => {
	let component: NotificationsComponent;

	const mockNotificationService = {
		notifications: signal([]),
		loadNotifications: jasmine.createSpy('loadNotifications'),
	};

	const mockProgramService = {
		events: signal([]),
		places: signal([]),
		days: signal({}),
		selectedDay: signal(undefined),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NotificationsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
			providers: [
				{provide: NotificationService, useValue: mockNotificationService},
				{provide: ProgramService, useValue: mockProgramService},
			],
		});

		const fixture = TestBed.createComponent(NotificationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
