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
import {StringToJsonPipe} from '../../common/pipes/string-to-json/string-to-json.pipe';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {NotificationsSettingsComponent} from './components/notifications-settings/notifications-settings.component';
import {INotificationSettings} from './types/INotificationSettings';
import {TranslateModule} from '@ngx-translate/core';

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
		TranslateModule
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
		private dialog: MatDialog,
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

	protected showSettings(): void {
		const dialog = this.dialog.open(NotificationsSettingsComponent, {
			data: {showNotifications: this.notificationService.showNotifications},
			width: '250px',
		});

		dialog.afterClosed().subscribe((result: INotificationSettings) => {
			if(result) {
				console.log('result', result);
				this.notificationService.showNotifications = result.showNotifications;
				// TODO: unsubscribe from notifications
			}
		});
	}
}
