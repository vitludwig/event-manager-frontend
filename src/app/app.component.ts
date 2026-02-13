import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {ProgramService} from './modules/program/services/program/program.service';
import dayjs from 'dayjs';
import {filter} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {ERoute} from './common/types/ERoute';
import {ELocalNotificationAction} from "./modules/notifications/types/ILocalNotificationPayload";
import {SettingsService} from "./common/services/settings/settings.service";
import {EDisplayDevice} from "./common/types/EDisplayDevice";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {

	private readonly translate: TranslateService = inject(TranslateService);
	private readonly notificationService: NotificationService = inject(NotificationService);
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly router: Router = inject(Router);
	private readonly destroyRef: DestroyRef = inject(DestroyRef);
	protected readonly settingsService: SettingsService = inject(SettingsService);

	protected EDisplayDevice = EDisplayDevice;

	#alreadyNotified: string[] = [];

	public async ngOnInit(): Promise<void> {
		this.handleLanguage();
		this.initLocalNotifications();

		this.handleSubscriptionBtn();

		await this.programService.initWebsocket();

		if(this.settingsService.device() === EDisplayDevice.INFO_PANEL) {
			document.body.className += ' display-info-panel';
		}
	}

	private handleSubscriptionBtn(): void {
		if(this.router.url !== `/${ERoute.NOTIFICATIONS}`) {
			this.toggleSubscriptionBtn(false);
		}

		this.router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			takeUntilDestroyed(this.destroyRef),
		).subscribe((event) => {
			this.toggleSubscriptionBtn(event.url === `/${ERoute.NOTIFICATIONS}`);
		});
	}

	private toggleSubscriptionBtn(value: boolean): void {
		const bell = document.getElementsByClassName('onesignal-customlink-container')[0];
		if(bell) {
			if(value) {
				bell.removeAttribute('hidden');
			} else {
				bell.setAttribute('hidden', 'true');
			}
		}
	}

	private handleLanguage(): void {
		let language = localStorage.getItem('language') ?? Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
		language = language.split('-')[0];
		if(!['cs', 'en'].includes(language)) {
			language = 'en';
		}

		this.translate.setDefaultLang(language);
		this.translate.use(language ?? this.translate.defaultLang);
	}

	private initLocalNotifications(): void {
		const intervalId = setInterval(() => {
			const now = dayjs();
			for(const favorite of this.programService.favorites) {
				const event = this.programService.getEvent(favorite.id);
				if(!event) {
					continue;
				}

				const diff = Math.abs(now.diff(dayjs(event.start), 'minutes'));
				const isInRange = diff >= 9 && diff <= 11;
				if(!this.#alreadyNotified.includes(favorite.id) && isInRange) {
					this.notificationService.showLocalNotification('Nadcházející akce', `${favorite.name} začíná za 10 minut!`,
						{
							actionId: ELocalNotificationAction.NAVIGATE_TO,
							value: `/event-detail/${favorite.id}`
						});
					this.#alreadyNotified.push(favorite.id);
				}
			}
		}, 60000);

		this.destroyRef.onDestroy(() => clearInterval(intervalId));
	}
}
