import {Injectable, signal, WritableSignal} from '@angular/core';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {INotification} from '../../types/INotification';
import {BehaviorSubject, Observable} from 'rxjs';


@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	#newNotification: BehaviorSubject<INotification | null> = new BehaviorSubject<INotification | null>(null);
	public newNotification$: Observable<INotification | null> = this.#newNotification.asObservable();

	public notifications: WritableSignal<INotification[]> = signal([]);

	#connection: HubConnection;

	constructor() {
		this.initWebsocket();
	}

	private async initWebsocket(): Promise<void> {
		this.#connection = new HubConnectionBuilder()
			.configureLogging(LogLevel.Critical)
			.withUrl('signalr/notifications')
			.build();

		try {
			await this.#connection.start();
			this.loadNotifications();
			this.handleNewNotification();
		} catch(e) {
			console.log('Notifications connection error: ', e);
		}
	}

	private handleNewNotification(): void {
		this.#connection.on('newNotification', (notification: INotification) => {
			console.log('new notification: ', notification);
		});
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
