import {Component, inject, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {SwPush} from '@angular/service-worker';
import {HttpClient} from '@angular/common/http';
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

		// TODO: do this on app load and reflect user notification settings
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

	@ViewChild('drawer')
	public drawer: MatDrawer;

	private handleLanguage(): void {
		const language = localStorage.getItem('language');

		this.#translate.setDefaultLang(language ?? this.#translate.getBrowserLang() ?? 'cs');
		this.#translate.use(language ?? this.#translate.defaultLang);
	}
}
