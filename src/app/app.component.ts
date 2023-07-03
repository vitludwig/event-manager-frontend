import {Component, inject, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {ProgramService} from './modules/program/services/program/program.service';
import * as dayjs from 'dayjs';
import {NavigationEnd, Router} from '@angular/router';
import {ERoute} from './common/types/ERoute';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	private readonly translate = inject(TranslateService);
	// private readonly swPush = inject(SwPush);
	private readonly notificationService: NotificationService = inject(NotificationService);
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly router: Router = inject(Router);

	#alreadyNotified: string[] = [];

	public async ngOnInit(): Promise<void> {
		this.handleLanguage();
		await this.handleLocalNotifications();
		await this.handlePermissions();

		await this.notificationService.initOneSignal();

		this.handleSubscriptionBtn();
	}

	private handleSubscriptionBtn(): void {
		if(this.router.url !== `/${ERoute.NOTIFICATIONS}`)  {
			this.toggleSubscriptionBtn(false);
		}

		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd) {
				console.log('event', event);

				if(event.url === `/${ERoute.NOTIFICATIONS}`) {
					this.toggleSubscriptionBtn(true);
				} else {
					this.toggleSubscriptionBtn(false);
				}
			}
		});
	}

	private toggleSubscriptionBtn(value: boolean): void {
		const bell = document.getElementsByClassName('onesignal-customlink-container')[0];
		if(bell) {
			if(value) {
				bell.removeAttribute('hidden');
			} else {
				bell.setAttribute('hidden', 'true');
			}
		}
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
