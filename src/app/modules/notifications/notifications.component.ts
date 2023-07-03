import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatRippleModule} from '@angular/material/core';
import {NotificationService} from './services/notification/notification.service';
import {ProgramService} from '../program/services/program/program.service';
import {Subject, takeUntil} from 'rxjs';
import {IEvent} from '../program/types/IEvent';
import {StringToJsonPipe} from '../../common/pipes/string-to-json/string-to-json.pipe';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatDialogModule} from '@angular/material/dialog';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-notifications',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatListModule,
		MatRippleModule,
		MatToolbarModule,
		MatDialogModule,
		StringToJsonPipe,
		TranslateModule,
	],
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
	protected eventsById: Record<string, IEvent | null> = {};

	protected readonly notificationService: NotificationService = inject(NotificationService);
	protected readonly translate = inject(TranslateService);
	private readonly programService: ProgramService = inject(ProgramService);

	#unsubscribe: Subject<void> = new Subject<void>();

	public ngOnInit(): void {
		this.programService.getEvents()
			.pipe(takeUntil(this.#unsubscribe))
			.subscribe((events) => {
				for(const event of events) {
					this.eventsById[event.id] = event;
				}
			});

		this.notificationService.loadNotifications();
	}

	public ngOnDestroy(): void {
		this.#unsubscribe.next();
	}
}
