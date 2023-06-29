import {Component, inject} from '@angular/core';
import {SwPush} from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {ProgramService} from './modules/program/services/program/program.service';
import * as dayjs from 'dayjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	#translate = inject(TranslateService);
	#swPush = inject(SwPush);
	#notificationService: NotificationService = inject(NotificationService);
	#programService: ProgramService = inject(ProgramService);
	#alreadyNotified: string[] = [];

	constructor() {
		this.handleLanguage();
		this.handleLocalNotifications();
		// const worker = new Worker('notification.worker.js');
		// setTimeout(() => {
		// 	worker.postMessage('test notification');
		// }, 5000);

		this.#swPush.subscription.subscribe((subscription) => {
			this.#notificationService.subscription = subscription
			console.log('NEW ', subscription);
			if(!subscription && this.#notificationService.showNotifications) {
				this.#notificationService.subscribe();
			}
		}, (err) => {
			console.error('Notification subscription error: ', err);
		});

	}

	private handleLanguage(): void {
		const language = localStorage.getItem('language');

		this.#translate.setDefaultLang(language ?? this.#translate.getBrowserLang() ?? 'cs');
		this.#translate.use(language ?? this.#translate.defaultLang);
	}


	private async handleLocalNotifications(): Promise<void> {
		try {
			const registration = await navigator.serviceWorker.getRegistration('notification.worker.js')
			console.log('SW registrations: ', registration);
			if(registration) {
				this.#notificationService.notificationRegistration = registration;
			}

			setInterval(() => {
				// TODO: filter only events after now
				console.log('checking');
				for(const favorite of this.#programService.favorites) {
					console.log('now ', dayjs());
					console.log('event', dayjs(favorite.start).subtract(10, 'minutes'));
					console.log('INCOMING', dayjs().isBefore(dayjs(favorite.start).subtract(10, 'minutes')));
					if(!this.#alreadyNotified.includes(favorite.id) && dayjs().isBefore(dayjs(favorite.start).subtract(10, 'minutes'))) {
						console.log('coming');
						this.#notificationService.showLocalNotification('Nadcházející akce', `${favorite.name} začíná za 10 minut!`);
						this.#alreadyNotified.push(favorite.id);
					}
				}
			}, 5000);
			// registration.initNotification();
			// registration?.showNotification('test', {
			// 	body: 'test body',
			// });

		} catch(err) {
			console.error('SW registration error: ', err);
		}
	}
}
