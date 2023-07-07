import {Component, inject, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {ProgramService} from './modules/program/services/program/program.service';
import * as dayjs from 'dayjs';
import {NavigationEnd, Router} from '@angular/router';
import {ERoute} from './common/types/ERoute';
import {SwUpdate} from '@angular/service-worker';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	private readonly translate = inject(TranslateService);
	private readonly swUpdate = inject(SwUpdate);
	private readonly notificationService: NotificationService = inject(NotificationService);
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly router: Router = inject(Router);

	#alreadyNotified: string[] = [];

	public async ngOnInit(): Promise<void> {
		this.checkForUpdates();

		this.handleLanguage();
		await this.handleLocalNotifications();
		await this.handlePermissions();

		await this.notificationService.initOneSignal();

		this.handleSubscriptionBtn();
	}

	private handleSubscriptionBtn(): void {
		if(this.router.url !== `/${ERoute.NOTIFICATIONS}`) {
			this.toggleSubscriptionBtn(false);
		}

		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd) {
				if(event.url === `/${ERoute.NOTIFICATIONS}`) {
					this.toggleSubscriptionBtn(true);
				} else {
					this.toggleSubscriptionBtn(false);
				}
			}
		});
	}

	/**
	 * Show or hide OneSignal's subscription button
	 * @param value
	 * @private
	 */
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
		let language = localStorage.getItem('language') ?? this.translate.getBrowserLang() ?? 'cs';
		if(!['cs', 'en'].includes(language)) {
			language = 'cs';
		}

		this.translate.setDefaultLang(language);
		this.translate.use(language ?? this.translate.defaultLang);
	}


	/**
	 * Loads registration from notification worker to show "local" notifications (instead of push by OneSignal)
	 * Periodically checks if there are any events incoming and show notification
	 *
	 * @private
	 */
	private async handleLocalNotifications(): Promise<void> {
		try {
			const registration = await navigator.serviceWorker.getRegistration('notification.worker.js');
			console.log('SW registrations: ', registration);
			if(registration) {
				this.notificationService.notificationRegistration = registration;
			}

			setInterval(() => {
				// TODO: filter only events after now
				const now = dayjs();
				for(const favorite of this.programService.favorites) {
					const event = this.programService.getEvent(favorite.id);
					if(!event) {
						continue;
					}

					const diff = Math.abs(now.diff(dayjs(event.start), 'minutes'));
					const isInRange = diff >= 9 && diff <= 11;
					if(!this.#alreadyNotified.includes(favorite.id) && isInRange) {
						this.notificationService.showLocalNotification('Nadcházející akce', `${favorite.name} začíná za 10 minut!`);
						this.#alreadyNotified.push(favorite.id);
					}
				}
			}, 60000);

		} catch(err) {
			console.error('SW registration error: ', err);
		}
	}

	/**
	 * Separate check for notification permissions used by local notifications
	 * TODO: app should use only OneSignal's permission popup
	 *
	 * @private
	 */
	private async handlePermissions(): Promise<void> {
		const permission = await Notification.requestPermission();
		this.notificationService.showNotifications = permission === 'granted';

		if(localStorage.getItem('showNotifications') === null) {
			this.notificationService.showNotifications = true;
		}
	}

	private async checkForUpdates(): Promise<void> {
		if(this.swUpdate.isEnabled) {
			try {
				const updateAvailable = await this.swUpdate.checkForUpdate();
				if(updateAvailable) {
					if(confirm(this.translate.instant('Nová verze aplikace je k dispozici. Chcete ji nyní nainstalovat?'))) {
						window.location.reload();
					}
				}
			} catch(err) {
				console.error('SW update error: ', err);
			}
		}
	}
}
