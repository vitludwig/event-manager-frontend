import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';

/**
 * Keeps web users off a stale app build — without ever reloading the page on its own.
 *
 * When the service worker has a newer version fully cached it emits VERSION_READY. We do NOT reload
 * automatically: reloading mid-use loses the user's place, and a "reload when the tab is hidden" trick
 * is unreliable on mobile because the OS freezes/suspends backgrounded pages, so the navigation may
 * never run. Instead we surface a persistent, dismissible snackbar; the user reloads when it suits them.
 * The reload runs only on their tap, while the app is in the foreground, and is served entirely from the
 * SW cache (the new version is already downloaded), so it works even on a very slow or dead connection.
 *
 * No-op on native and in dev: there the service worker is disabled (see app.module), so swUpdate.isEnabled
 * is false and nothing here runs — the native app updates with its binary, not via a web service worker.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
	private readonly swUpdate = inject(SwUpdate);
	private readonly document = inject(DOCUMENT);
	private readonly snackBar = inject(MatSnackBar);
	private readonly translate = inject(TranslateService);
	private readonly destroyRef = inject(DestroyRef);

	private promptShown = false;

	public init(): void {
		if (!this.swUpdate.isEnabled) {
			return;
		}

		this.swUpdate.versionUpdates
			.pipe(
				filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(() => this.promptReload());
	}

	private promptReload(): void {
		// One standing prompt is enough; further VERSION_READY events shouldn't stack snackbars.
		if (this.promptShown) {
			return;
		}
		this.promptShown = true;

		const isCs = this.translate.currentLang === 'cs';
		const ref = this.snackBar.open(
			isCs ? 'Je k dispozici nová verze aplikace.' : 'A new app version is available.',
			isCs ? 'Obnovit' : 'Reload',
			// No duration: the prompt stays until the user acts, surviving background/foreground.
			{ verticalPosition: 'top' },
		);

		ref.onAction()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => {
				// Activate right before reloading so the still-running old app never gets new lazy chunks.
				// Served from cache — safe offline. If activation rejects, reload anyway so a tap is never
				// a dead end that leaves the user pinned to the stale build.
				this.swUpdate.activateUpdate()
					.then(() => this.document.location.reload())
					.catch(() => this.document.location.reload());
			});

		ref.afterDismissed()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((info) => {
				// MatSnackBar has a single outlet, so an unrelated app snackbar can evict this prompt
				// before the user acts. Re-arm (unless they tapped Reload) so a later VERSION_READY can
				// surface it again instead of the user being stranded on the old build for the session.
				if (!info.dismissedByAction) {
					this.promptShown = false;
				}
			});
	}
}
