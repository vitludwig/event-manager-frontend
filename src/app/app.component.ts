import {Component, inject} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {ProgramService} from './modules/program/services/program/program.service';
import { AngularDeviceInformationService } from 'angular-device-information';
import { OneSignal } from 'onesignal-ngx';
import * as dayjs from 'dayjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	private readonly translate = inject(TranslateService);
	// private readonly swPush = inject(SwPush);
	private readonly notificationService: NotificationService = inject(NotificationService);
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly deviceInformationService: AngularDeviceInformationService = inject(AngularDeviceInformationService);
	private readonly oneSignal: OneSignal = inject(OneSignal);

	#alreadyNotified: string[] = [];

	constructor() {
		this.handleLanguage();
		// this.handleLocalNotifications();
		// this.handlePermissions();

		// this.swPush.subscription.subscribe((subscription) => {
		// 	this.notificationService.subscription = subscription
		// 	console.log('NEW ', subscription);
		// 	if(!subscription && this.notificationService.showNotifications) {
		// 		this.notificationService.subscribe();
		// 	}
		// }, (err) => {
		// 	console.error('Notification subscription error: ', err);
		// });
		this.oneSignal.init({
			appId: "31a5956f-5e42-4af4-a178-6da520ecac86",
			promptOptions: {
				slidedown: {
					enabled: true,
					autoPrompt: true,
					timeDelay: 5,
				}
			},
			serviceWorkerParam: {
				scope: '/push/onesignal/'
			}
		}).then(() => {
			// this.oneSignal.showNativePrompt();
			console.log('OneSignal initialized');
		});
	}

	private handleLanguage(): void {
		const language = localStorage.getItem('language');

		this.translate.setDefaultLang(language ?? this.translate.getBrowserLang() ?? 'cs');
		this.translate.use(language ?? this.translate.defaultLang);
	}


	private async handleLocalNotifications(): Promise<void> {
		try {
			const registration = await navigator.serviceWorker.getRegistration('notification.worker.js')
			console.log('SW registrations: ', registration);
			if(registration) {
				this.notificationService.notificationRegistration = registration;
			}

			setInterval(() => {
				// TODO: filter only events after now
				// console.log('checking');
				for(const favorite of this.programService.favorites) {
					// console.log('now ', dayjs());
					// console.log('event', dayjs(favorite.start).subtract(10, 'minutes'));
					// console.log('INCOMING', dayjs().isBefore(dayjs(favorite.start).subtract(10, 'minutes')));
					if(!this.#alreadyNotified.includes(favorite.id) && dayjs().isBefore(dayjs(favorite.start).subtract(10, 'minutes'))) {
						console.log('coming');
						this.notificationService.showLocalNotification('Nadcházející akce', `${favorite.name} začíná za 10 minut!`);
						this.#alreadyNotified.push(favorite.id);
					}
				}
			}, 5000);

		} catch(err) {
			console.error('SW registration error: ', err);
		}
	}

	private async handlePermissions(): Promise<void> {
		const permission = await Notification.requestPermission();
		this.notificationService.showNotifications = permission === 'granted';

		if(localStorage.getItem('showNotifications') === null) {
			this.notificationService.showNotifications = true;
		}
	}
}
