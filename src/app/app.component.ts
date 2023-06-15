import {Component, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {SwPush} from '@angular/service-worker';
import {HttpClient} from '@angular/common/http';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public sidemenuOpened = false;
	public operationName: string;
	private _subscription: PushSubscription | null;
	#publicKey = 'BM8bnspodQNmqUo03YgrvzhPiRZP5paOop_NK_SiRJfG8GW9DUw-H-FtXVQYtmLAMiakkFhc4KCdT6ep7InBbu0';
	#privateKey = 'oOxhtspU0M-4dvui_leF9Lh13o177XGqTl85wsCnr2U';

	constructor(
		private swPush: SwPush,
		private httpClient: HttpClient,
	) {
		swPush.subscription.subscribe((subscription) => {
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
				this.operationName = 'err ' + error;
				console.error(error);
			});
	}

	private unsubscribe(endpoint: any) {
		this.swPush.unsubscribe()
			.then(() => this.httpClient.delete('/api/v1/notification/subscription/' + encodeURIComponent(endpoint)).subscribe(() => {
				},
				error => console.error(error)
			))
			.catch(error => console.error(error));
	}
}
