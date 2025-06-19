import {Injectable} from '@angular/core';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {IProgramPlace} from '../../types/IProgramPlace';
import {TEventMethodName} from './types/TEventMethodName';
import {IEvent} from '../../types/IEvent';

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private connection: HubConnection;

	public on<T>(name: TEventMethodName, callback: (args: T) => void): void {
		this.connection.on(name, (data) => {
			callback(data);
		});
	}

	public async initWebsocket(): Promise<void> {
		try {
			this.connection = new HubConnectionBuilder()
				.configureLogging(LogLevel.Critical)
				.withUrl('signalr/events')
				.build();

			await this.connection.start();
		} catch(e) {
			console.error('Cannot init event WS: ', e);
		}
	}

	public getEvents(): Promise<IEvent[]> {
		return this.connection.invoke('getEvents');
	}

	public getPlaces(): Promise<IProgramPlace[]> {
		return this.connection.invoke('getPlaces');
	}
}
