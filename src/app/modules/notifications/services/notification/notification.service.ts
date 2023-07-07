import {inject, Injectable, isDevMode, signal, WritableSignal} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {IOneSignalNotification, IOneSignalNotificationsResponse} from '../../types/IOneSignalNotificationsResponse';
import {OneSignal} from 'onesignal-ngx';
import {TranslateService} from '@ngx-translate/core';


@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	public notifications: WritableSignal<IOneSignalNotification[]> = signal([]);
	public subscription: PushSubscription | null;
	public notificationRegistration: ServiceWorkerRegistration;

	public get showNotifications(): boolean {
		return localStorage.getItem('showNotifications') === 'true';
	}

	public set showNotifications(value: boolean) {
		localStorage.setItem('showNotifications', value.toString());
	}

	private readonly http = inject(HttpClient);
	private readonly oneSignal: OneSignal = inject(OneSignal);
	private readonly translate = inject(TranslateService);


	constructor() {
		this.loadNotifications();
	}

	public unsubscribe() {
		if(!this.subscription) {
			console.warn('Cannot unsubscribe, subscription is null.');
			return;
		}
	}

	public showLocalNotification(title: string, body: string = ''): Promise<void> {
		return this.notificationRegistration.showNotification('[LOCAL] ' + title, {
			body: body,
			icon: '/assets/icons/icon-72x72.png',
		});
	}

	public async initOneSignal(): Promise<void> {
		if(isDevMode()) {
			return;
		}
		try {
			const oneSignal = this.oneSignal.init({
				appId: environment.oneSignalAppId,
				allowLocalhostAsSecureOrigin: true,
				safari_web_id: "web.onesignal.auto.45e32f52-047f-48ea-8b6f-5a9d2fcde2db",
				promptOptions: {
					slidedown: {
						enabled: true,
						autoPrompt: true,
						timeDelay: 5,
						pageViews: 1,
						text: this.translate.currentLang === 'en' ? 'We would like to send you notifications about upcoming events and program updates.' : 'Rádi bychom vám posílali notifikace o nadcházejících akcích a aktualizacích programu.',
					},

					customlink: {
						enabled: true, /* Required to use the Custom Link */
						style: "button", /* Has value of 'button' or 'link' */
						size: "medium", /* One of 'small', 'medium', or 'large' */
						color: {
							button: '#7859a0', /* Color of the button background if style = "button" */
							text: '#FFFFFF', /* Color of the prompt's text */
						},
						text: {
							subscribe: this.translate.currentLang === 'en' ? 'Enable notifications' : 'Povolit notifikace',
							unsubscribe: this.translate.currentLang === 'en' ? "Disable notifications" : 'Zakázat notifikace',
						},
						unsubscribeEnabled: true, /* Controls whether the prompt is visible after subscription */
					},
				},
			});
			await oneSignal;

			console.log('OneSignal initialized');
			this.oneSignal.on('subscriptionChange', (isSubscribed) => {
				console.log("The user's subscription state is now:", isSubscribed);
				this.showNotifications = isSubscribed;
			});

			return oneSignal;
		} catch(e) {
			console.error('OneSignal initialization failed: ', e);
		}
	}

	public async loadNotifications(): Promise<void> {
		try {
			// TODO: add this to interceptor
			const headers = new HttpHeaders({
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': 'Basic ' + environment.oneSignalApiKey,
			});

			const notifications = await firstValueFrom(
				this.http.get<IOneSignalNotificationsResponse>(`https://onesignal.com/api/v1/notifications?app_id=${environment.oneSignalAppId}`,
					{headers})
			);
			notifications.notifications = notifications.notifications.filter(obj => Object.keys(obj.headings).length > 0);

			this.notifications.set(notifications.notifications);
		} catch(e) {
			console.error('Cannot load notifications: ', e);
		}
	}
}
