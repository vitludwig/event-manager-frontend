import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {INotification} from '../../types/INotification';
import {SwPush} from '@angular/service-worker';
import {HttpClient} from '@angular/common/http';


@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	public notifications: WritableSignal<INotification[]> = signal([]);
	public subscription: PushSubscription | null;
	public notificationRegistration: ServiceWorkerRegistration;

	public get showNotifications(): boolean {
		return localStorage.getItem('showNotifications') === 'true';
	}

	public set showNotifications(value: boolean) {
		localStorage.setItem('showNotifications', value.toString());
	}

	#connection: HubConnection;
	#publicKey = 'BM8bnspodQNmqUo03YgrvzhPiRZP5paOop_NK_SiRJfG8GW9DUw-H-FtXVQYtmLAMiakkFhc4KCdT6ep7InBbu0';

	private readonly swPush: SwPush = inject(SwPush);
	private readonly httpClient = inject(HttpClient);


	constructor() {
		this.initWebsocket();
	}

	/**
	 * Subscribe to server for push notifications using VAPID keys
	 */
	public subscribe() {
		// Retrieve public VAPID key from the server

		this.swPush.requestSubscription({
			serverPublicKey: this.#publicKey
		})
			.then((subscription) => {
				this.httpClient.post('/api/v1/notification/subscription', subscription).subscribe(
					() => console.log('Sent push subscription object to server.'),
					(error) => console.log('Could not send subscription object to server, reason: ', error)
				);
			})
			.catch(error => {
				console.error(error);
			});
	}

	public unsubscribe() {
		if(!this.subscription) {
			console.warn('Cannot unsubscribe, subscription is null.');
			return;
		}

		const endpoint = this.subscription.endpoint;
		this.swPush.unsubscribe()
			.then(() => this.httpClient.delete('/api/v1/notification/subscription/' + encodeURIComponent(endpoint)).subscribe(() => {
				},
				error => console.error(error)
			))
			.catch(error => console.error(error));
	}

	public showLocalNotification(title: string, body: string = ''): Promise<void> {
		return this.notificationRegistration.showNotification('[LOCAL] ' + title, {
			body: body,
			icon: '/assets/icons/icon-72x72.png',
			image: '/assets/icons/icon-72x72.png',
		});
	}

	private async initWebsocket(): Promise<void> {
		this.#connection = new HubConnectionBuilder()
			.configureLogging(LogLevel.Critical)
			.withUrl('signalr/notifications')
			.build();

		try {
			await this.#connection.start();
			this.loadNotifications();
		} catch(e) {
			console.log('Notifications connection error: ', e);
		}
	}

	private async loadNotifications(): Promise<void> {
		try {
			const result = (
				await this.#connection.invoke<INotification[]>('getNotifications', {})
			);

			this.notifications.set(result);
		} catch(e) {
			console.error('Cannot load notifications: ', e);
		}
	}
}
