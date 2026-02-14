import {Injectable} from '@angular/core';
import {HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel} from '@microsoft/signalr';
import {IProgramPlace} from '../../types/IProgramPlace';
import {TEventMethodName} from './types/TEventMethodName';
import {IEvent} from '../../types/IEvent';
import {environment} from "../../../../../environments/environment";

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private connection!: HubConnection;
	private reconnectedCallback: (() => void) | null = null;

	public on<T>(name: TEventMethodName, callback: (args: T) => void): void {
		if(!this.connection) {
			return;
		}
		this.connection.on(name, (data) => {
			callback(data);
		});
	}

	public off(name: TEventMethodName): void {
		if(!this.connection) {
			return;
		}
		this.connection.off(name);
	}

	public onReconnected(callback: () => void): void {
		this.reconnectedCallback = callback;
	}

	public get isConnected(): boolean {
		return this.connection?.state === HubConnectionState.Connected;
	}

	public async initWebsocket(): Promise<void> {
		this.connection = new HubConnectionBuilder()
			.configureLogging(LogLevel.Warning)
			.withUrl(`${environment.signalrUrl}/signalr/events`)
			.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
			.build();

		this.connection.onreconnected(() => {
			this.reconnectedCallback?.();
		});

		this.connection.onclose((error) => {
			console.error('SignalR connection closed permanently: ', error);
		});

		await this.connection.start();
	}

	public getEvents(): Promise<IEvent[]> {
		return this.connection.invoke('getEvents');
	}

	public getPlaces(): Promise<IProgramPlace[]> {
		return this.connection.invoke('getPlaces');
	}
}
