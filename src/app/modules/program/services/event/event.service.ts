import {Injectable, signal, WritableSignal} from '@angular/core';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';
import {TEventMethodName} from './types/TEventMethodName';
import {IEvent} from '../../types/IEvent';

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private connection: HubConnection;

	constructor() {
		// this.initWebsocket();
	}

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

	public async getEvents(): Promise<IEvent[]> {
		return this.connection.invoke('getEvents');
	}

	public async getPlaces(): Promise<IProgramPlace[]> {
		return this.connection.invoke('getPlaces');
	}
}
