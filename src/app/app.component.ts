import {Component, DestroyRef, inject, NgZone, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateService} from '@ngx-translate/core';
import {NotificationService} from './modules/notifications/services/notification/notification.service';
import {EventReminderService} from './modules/notifications/services/event-reminder/event-reminder.service';
import {ProgramService} from './modules/program/services/program/program.service';
import {filter} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {Location} from '@angular/common';
import {ERoute} from './common/types/ERoute';
import {SettingsService} from "./common/services/settings/settings.service";
import {EDisplayDevice} from "./common/types/EDisplayDevice";
import {App} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';
import {Keyboard} from '@capacitor/keyboard';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PwaUpdateService} from './common/services/pwa-update/pwa-update.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
	standalone: false,
})
export class AppComponent implements OnInit {

	private readonly translate: TranslateService = inject(TranslateService);
	// Injected for its bootstrap side-effect (OneSignal + local-notification channel init).
	private readonly notificationService: NotificationService = inject(NotificationService);
	private readonly reminderService: EventReminderService = inject(EventReminderService);
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly router: Router = inject(Router);
	private readonly location: Location = inject(Location);
	private readonly destroyRef: DestroyRef = inject(DestroyRef);
	private readonly ngZone: NgZone = inject(NgZone);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);
	private readonly pwaUpdateService: PwaUpdateService = inject(PwaUpdateService);
	protected readonly settingsService: SettingsService = inject(SettingsService);

	protected EDisplayDevice = EDisplayDevice;

	public async ngOnInit(): Promise<void> {
		this.pwaUpdateService.init();
		this.handleLanguage();
		this.initAppLifecycle();
		this.initReminderResync();
		this.initHardwareBackButton();
		await this.initStatusBar();

		this.handleSubscriptionBtn();

		await this.programService.initWebsocket();

		if (this.programService.eventsLoadFailed()) {
			const isCs = this.translate.currentLang === 'cs';
			this.snackBar.open(
				isCs ? 'Nepodařilo se připojit k serveru. Zobrazují se poslední uložená data.' : 'Could not connect to server. Showing last saved data.',
				'OK',
				{ duration: 8000, verticalPosition: 'top', panelClass: 'mdc-snackbar--warning' }
			);
		}

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

	private async initStatusBar(): Promise<void> {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		await StatusBar.setOverlaysWebView({ overlay: true });
		await StatusBar.setStyle({ style: Style.Dark });
		try {
			await Keyboard.setAccessoryBarVisible({ isVisible: false });
		} catch {
			// Not supported on all platforms
		}
	}

	private initAppLifecycle(): void {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		// On resume the socket may have been suspended and data gone stale. ensureConnected()
		// is idempotent — it reconnects only if the socket was never started (e.g. launched
		// offline) and otherwise lets socket.io's reconnection refresh things. It never opens
		// a second socket, so notifications/websocket handlers are not duplicated.
		App.addListener('appStateChange', ({isActive}) => {
			if (isActive) {
				this.ngZone.run(() => void this.programService.ensureConnected());
			}
		});
	}

	private initHardwareBackButton(): void {
		if(!Capacitor.isNativePlatform()) {
			return;
		}

		App.addListener('backButton', () => {
			this.ngZone.run(() => {
				if(this.dialog.openDialogs.length > 0) {
					this.dialog.openDialogs[this.dialog.openDialogs.length - 1].close();
					return;
				}

				const url = this.router.url;
				if(url === '/' || url === `/${ERoute.PROGRAM}`) {
					App.exitApp();
				} else {
					this.location.back();
				}
			});
		});
	}

	private initReminderResync(): void {
		// Favorite reminders are scheduled with the OS by ProgramService whenever favorites or
		// program data change. Reminder text is language-specific, so re-sync on language change
		// to refresh already-scheduled reminders. (No-op on web.)
		this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			void this.reminderService.sync(this.programService.favorites);
		});
	}
}
