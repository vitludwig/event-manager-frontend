import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {firstValueFrom} from 'rxjs';
import {IOneSignalNotification, IOneSignalNotificationsResponse} from '../../types/IOneSignalNotificationsResponse';
import OneSignal  from 'onesignal-cordova-plugin';
import {ActionPerformed, Channel, LocalNotifications, ScheduleOptions} from "@capacitor/local-notifications";
import {Capacitor} from "@capacitor/core";
import {ELocalNotificationAction, ILocalNotificationPayload} from "../../types/ILocalNotificationPayload";
import {Router} from "@angular/router";
import {ERoute} from "../../../../common/types/ERoute";
import {CustomizationService} from "../../../../common/services/customization/customization.service";

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
	private readonly customizationService = inject(CustomizationService);

	private readonly defaultChannelId = 'local_notification_channel';
	private readonly storyTagKey = 'story_notifications';
	private readonly storyLocalStorageKey = 'storyNotificationsEnabled';
	private readonly storySegmentName = 'Story Subscribers';
	public readonly isSubscribedToStories = signal(localStorage.getItem('storyNotificationsEnabled') === 'true');
	private oneSignalReady = false;

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
					channelId: this.defaultChannelId,
					smallIcon: 'res://mipmap/ic_launcher',
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
		} catch (error) {
			console.error('Error scheduling notification:', error);
		}
	}

	private async initLocalNotifications() {
		if(Capacitor.getPlatform() === 'android') {
			await this.createDefaultLocalNotificationChannel();
		}
	}

	private async createDefaultLocalNotificationChannel() {
		const channel: Channel = {
			id: 'local_notification_channel',
			name: 'Local notification channel',
			description: '',
			importance: 4,
			visibility: 1,
			sound: 'default',
			vibration: true,
		};
		try {
			await LocalNotifications.createChannel(channel);
		} catch (error) {
			console.error('Error creating channel:', error);
		}
	}

	private async initOneSignal(): Promise<void> {
		if(!Capacitor.isNativePlatform()) {
			return;
		}

		try {
			const oneSignalAppId = this.customizationService.oneSignalAppId;
			if (!oneSignalAppId) {
				console.warn('OneSignal app ID not configured');
				return;
			}

			OneSignal.initialize(oneSignalAppId);

			const accepted = await OneSignal.Notifications.requestPermission(true);
			console.log('OneSignal: permission accepted:', accepted);

			OneSignal.Notifications.addEventListener('click', () => this.router.navigate([`/${ERoute.NOTIFICATIONS}`]));
			this.oneSignalReady = true;
		} catch(e) {
			console.error('Cannot initialize OneSignal:', e);
		}
	}

	public async loadNotifications(): Promise<void> {
		try {
			const notifications = await firstValueFrom(
				this.http.get<IOneSignalNotificationsResponse>(`${environment.apiUrl}/notification`)
			);

			const filtered = this.isSubscribedToStories()
				? notifications.notifications
				: notifications.notifications.filter(
					n => !(n.included_segments ?? []).includes(this.storySegmentName)
				);

			this.notifications.set(filtered);
		} catch(e) {
			console.error('Cannot load notifications:', e);
		}
	}

	public async subscribeToStories(): Promise<void> {
		localStorage.setItem(this.storyLocalStorageKey, 'true');
		this.isSubscribedToStories.set(true);
		if (Capacitor.isNativePlatform() && this.oneSignalReady) {
			try {
				OneSignal.User.addTag(this.storyTagKey, 'true');
			} catch (e) {
				localStorage.setItem(this.storyLocalStorageKey, 'false');
				this.isSubscribedToStories.set(false);
				console.error('OneSignal: failed to add tag', e);
			}
		}
	}

	public async unsubscribeFromStories(): Promise<void> {
		localStorage.setItem(this.storyLocalStorageKey, 'false');
		this.isSubscribedToStories.set(false);
		if (Capacitor.isNativePlatform() && this.oneSignalReady) {
			try {
				OneSignal.User.removeTag(this.storyTagKey);
			} catch (e) {
				localStorage.setItem(this.storyLocalStorageKey, 'true');
				this.isSubscribedToStories.set(true);
				console.error('OneSignal: failed to remove tag', e);
			}
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
