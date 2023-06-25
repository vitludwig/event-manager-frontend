import {Component, inject} from '@angular/core';
import {SwPush} from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	#translate = inject(TranslateService);
	#swPush = inject(SwPush);
	#notificationService: NotificationService = inject(NotificationService);

	constructor() {
		this.handleLanguage();

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
}
