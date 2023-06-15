import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatRippleModule} from '@angular/material/core';
import {NotificationService} from './services/notification/notification.service';
import {ProgramService} from '../program/services/program/program.service';
import {Subject, takeUntil} from 'rxjs';
import {IEvent} from '../program/types/IEvent';

@Component({
	selector: 'app-notifications',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatListModule,
		MatRippleModule
	],
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
	protected eventsById: Record<string, IEvent> = {};
	#unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		public notificationService: NotificationService,
		private programService: ProgramService,
	) {

	}

	public ngOnInit(): void {
		this.programService.getEvents()
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe((events) => {
				for(const event of events) {
					this.eventsById[event.id] = event;
				}
			});
	}

	public ngOnDestroy(): void {
		this.#unsubscribe.next();
	}
}
