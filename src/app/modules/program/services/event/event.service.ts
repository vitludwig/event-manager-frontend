import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IProgramPlace} from '../../types/IProgramPlace';
import {TEventMethodName} from './types/TEventMethodName';
import {IEvent} from '../../types/IEvent';
import {environment} from "../../../../../environments/environment";
import {firstValueFrom, timeout} from 'rxjs';
import {io, Socket} from 'socket.io-client';
import {retryWithBackoff} from "../../../../common/utils/retry-with-backoff";

@Injectable({
	providedIn: 'root'
})
export class EventService {
	private socket: Socket | null = null;
	private reconnectedCallback: (() => void) | null = null;
	private readonly http: HttpClient = inject(HttpClient);

	public on<T>(name: TEventMethodName, callback: (args: T) => void): void {
		if (!this.socket) {
			return;
		}
		this.socket.on(name, (data: T) => {
			callback(data);
		});
	}

	public off(name: TEventMethodName): void {
		if (!this.socket) {
			return;
		}
		this.socket.off(name);
	}

	public onReconnected(callback: () => void): void {
		this.reconnectedCallback = callback;
	}

	public get isConnected(): boolean {
		return this.socket?.connected ?? false;
	}

	public async initWebsocket(): Promise<void> {
		// Idempotent: never create a second socket. A duplicate socket would register
		// duplicate handlers (and could produce duplicate notifications). socket.io's
		// own reconnection handles drops once the single socket exists.
		if (this.socket) {
			return;
		}

		// Connect to the server ORIGIN so socket.io uses the default namespace "/". environment.apiUrl
		// includes the REST base path (/api); passing it whole makes socket.io treat "/api" as the
		// namespace → server rejects it with "Invalid namespace". socket.io is served at /socket.io/.
		this.socket = io(new URL(environment.apiUrl).origin, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 2000,
			reconnectionDelayMax: 30000,
		});

		this.socket.on('connect', () => {
			console.log('Socket.IO connected');
		});

		// Reconnection events are emitted by the Manager (this.socket.io), NOT the Socket;
		// `this.socket.on('reconnect')` would never fire, so the post-reconnect data refresh
		// would silently never run.
		this.socket.io.on('reconnect', () => {
			this.reconnectedCallback?.();
		});

		this.socket.on('disconnect', (reason) => {
			console.error('Socket.IO disconnected: ', reason);
		});

		return new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				resolve(); // Don't block app init if WebSocket fails
			}, 5000);

			this.socket!.on('connect', () => {
				clearTimeout(timeout);
				resolve();
			});

			this.socket!.on('connect_error', (error) => {
				console.error('Socket.IO connection error: ', error);
				clearTimeout(timeout);
				resolve(); // Don't block app init
			});
		});
	}

	public async getEvents(): Promise<IEvent[]> {
		return firstValueFrom(this.http.get<IEvent[]>(`${environment.apiUrl}/public/events`).pipe(timeout(10_000), retryWithBackoff()));
	}

	public async getPlaces(): Promise<IProgramPlace[]> {
		return firstValueFrom(this.http.get<IProgramPlace[]>(`${environment.apiUrl}/public/locations`).pipe(timeout(10_000), retryWithBackoff()));
	}
}
