import {Component, inject, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {SwPush} from '@angular/service-worker';
import {HttpClient} from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public operationName: string;
	private _subscription: PushSubscription | null;
	#publicKey = 'BM8bnspodQNmqUo03YgrvzhPiRZP5paOop_NK_SiRJfG8GW9DUw-H-FtXVQYtmLAMiakkFhc4KCdT6ep7InBbu0';
	#privateKey = 'oOxhtspU0M-4dvui_leF9Lh13o177XGqTl85wsCnr2U';


	#translate = inject(TranslateService);
	#swPush = inject(SwPush);
	#httpClient = inject(HttpClient);

	constructor() {
		this.handleLanguage();

		// TODO: do this on app load and reflect user notification settings
		this.#swPush.subscription.subscribe((subscription) => {
			this._subscription = subscription;
			this.operationName = (this._subscription === null) ? 'Subscribe' : 'Unsubscribe';
		}, (err) => {
			this.operationName = 'err ' + err;
		});

	}

	@ViewChild('drawer')
	public drawer: MatDrawer;

	public toggleSidebar(): void {
		this.drawer.toggle();
	}

	operation() {
		(this._subscription === null) ? this.subscribe() : this.unsubscribe(this._subscription.endpoint);
	}

	private subscribe() {
		// Retrieve public VAPID key from the server

		this.#swPush.requestSubscription({
			serverPublicKey: this.#publicKey
		})
			.then((subscription) => {
				this.#httpClient.post('/api/v1/notification/subscription', subscription).subscribe(
					() => console.log('Sent push subscription object to server.'),
					(error) => console.log('Could not send subscription object to server, reason: ', error)
				);
			})
			.catch(error => {
				this.operationName = 'err ' + error;
				console.error(error);
			});
	}

	private unsubscribe(endpoint: any) {
		this.#swPush.unsubscribe()
			.then(() => this.#httpClient.delete('/api/v1/notification/subscription/' + encodeURIComponent(endpoint)).subscribe(() => {
				},
				error => console.error(error)
			))
			.catch(error => console.error(error));
	}

	private handleLanguage(): void {
		const language = localStorage.getItem('language');

		this.#translate.setDefaultLang(language ?? this.#translate.getBrowserLang() ?? 'cs');
		this.#translate.use(language ?? this.#translate.defaultLang);
	}
}
