import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {IOneSignalNotification, IOneSignalNotificationsResponse} from '../../types/IOneSignalNotificationsResponse';
import OneSignal  from 'onesignal-cordova-plugin';
import {ActionPerformed, Channel, LocalNotifications, ScheduleOptions} from "@capacitor/local-notifications";
import {Capacitor} from "@capacitor/core";
import {ELocalNotificationAction, ILocalNotificationPayload} from "../../types/ILocalNotificationPayload";
import {Router} from "@angular/router";
import {ERoute} from "../../../../common/types/ERoute";

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	public notifications: WritableSignal<IOneSignalNotification[]> = signal([]);
	private readonly router: Router = inject(Router);

	public get showNotifications(): boolean {
		return localStorage.getItem('showNotifications') === 'true';
	}

	public set showNotifications(value: boolean) {
		localStorage.setItem('showNotifications', value.toString());
	}

	private readonly http = inject(HttpClient);

	private readonly defaultChannelId = 'local_notification_channel';


	constructor() {
		this.initLocalNotifications();
		this.addNotificationActionListeners();
		this.initOneSignal();
		this.loadNotifications();
	}

	async showLocalNotification(
		title: string,
		body: string,
		data?: ILocalNotificationPayload,
	): Promise<void> {
		const notificationId = Math.floor(Math.random() * 0x7FFFFFFF);
		const options: ScheduleOptions = {
			notifications: [
				{
					id: notificationId,
					title: title,
					body: body,
					channelId: this.defaultChannelId, // ** Crucial for Android 8+ **
					smallIcon: 'res://mipmap/ic_launcher', // Default to app icon if not provided
					// To use a specific icon, place it in android/app/src/main/res/drawable (e.g., my_notif_icon.png)
					// and refer to it as 'my_notif_icon' (without extension) or 'res://drawable/my_notif_icon'
					// For Material Design icons, it's often 'ic_stat_icon_name'.
					// Check Android documentation for status bar icon guidelines (typically white and transparent).
					sound: 'default',
					schedule: {
						at: new Date(Date.now() + 1000),
						allowWhileIdle: true,
					},
					extra: data,
				},
			],
		};

		try {
			await LocalNotifications.schedule(options);
			console.log(`Local notification scheduled.`);
		} catch (error) {
			console.error(`Error scheduling notification:`, error);
		}
	}

	private async initLocalNotifications() {
		if(Capacitor.getPlatform() === 'android') {
			// if this is uncommented, then there might be two permission overlays and user cannot click on it
			// if(!await this.permissionsService.hasLocalNotificationPermissions()) {
			// 	if(!(await this.permissionsService.requestLocalNotificationPermissions())) {
			// 		console.error('Local notification permission denied')
			// 		return;
			// 	}
			// }

			await this.createDefaultLocalNotificationChannel();
		}
	}

	private async createDefaultLocalNotificationChannel() {
		const channel: Channel = {
			id: 'local_notification_channel',
			name: 'Local notification channel',
			description: '',
			importance: 4, // Corresponds to NotificationManager.IMPORTANCE_DEFAULT or IMPORTANCE_HIGH. 5 is IMPORTANCE_MAX
			visibility: 1, // Corresponds to NotificationCompat.VISIBILITY_PUBLIC
			sound: 'default', // Use 'default' or specify a sound file in res/raw
			vibration: true,
		};
		try {
			await LocalNotifications.createChannel(channel);
			console.log(`Notification channel created or already exists.`);
		} catch (error) {
			console.error(`Error creating channel ':`, error);
		}

	}

	private initOneSignal() {
		// TODO: remove verbose logging in production
		//OneSignal.Debug.setLogLevel(6);
		OneSignal.initialize(environment.oneSignalAppId);
		// Use this method to prompt for push notifications.
		// We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
		OneSignal.Notifications.requestPermission(false).then((accepted: boolean) => {
			console.log("User accepted notifications: " + accepted);
		});

		OneSignal.Notifications.addEventListener('click', () => this.router.navigate([`/${ERoute.NOTIFICATIONS}`]));
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

	private addNotificationActionListeners() {
		if(Capacitor.getPlatform() === 'android') {
			LocalNotifications.addListener(
				'localNotificationActionPerformed',
				(notificationAction: ActionPerformed) => {
					const data = notificationAction.notification.extra as ILocalNotificationPayload;
					if (data) {
						switch(data.actionId) {
							case ELocalNotificationAction.NAVIGATE_TO:
								this.router.navigate([data.value])
								break;
						}
					}
				}
			);
		}
	}
}
