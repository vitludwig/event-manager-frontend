import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { TranslateService } from '@ngx-translate/core';
import dayjs, { Dayjs } from 'dayjs';
import { IEvent } from '../../../program/types/IEvent';
import { ELocalNotificationAction } from '../../types/ILocalNotificationPayload';

const REMINDER_LEAD_MINUTES = 10;
const REMINDER_CHANNEL_ID = 'local_notification_channel';

export interface IPlannedReminder {
	id: number;
	eventId: string;
	at: Date;
	title: string;
	body: string;
	route: string;
}

/**
 * Stable, deterministic 31-bit positive id derived from an event id, so a reminder can be
 * cancelled or replaced later (native notification ids are 32-bit signed ints).
 */
export function reminderNotificationId(eventId: string): number {
	let hash = 0;
	for (let i = 0; i < eventId.length; i++) {
		hash = (Math.imul(31, hash) + eventId.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) % 2147483647;
}

/**
 * Pure: which reminders should exist for the given favorites at time `now`. Only reminders
 * whose fire time is still in the future are planned (no point scheduling the past).
 */
export function planEventReminders(favorites: IEvent[], now: Dayjs, isCs: boolean): IPlannedReminder[] {
	const planned: IPlannedReminder[] = [];
	for (const event of favorites) {
		const at = dayjs(event.startAt).subtract(REMINDER_LEAD_MINUTES, 'minute');
		if (!at.isAfter(now)) {
			continue;
		}
		const name = isCs ? event.nameCs : (event.nameEn || event.nameCs);
		planned.push({
			id: reminderNotificationId(event.id),
			eventId: event.id,
			at: at.toDate(),
			title: isCs ? 'Nadcházející akce' : 'Upcoming event',
			body: isCs
				? `${name} začíná za ${REMINDER_LEAD_MINUTES} minut!`
				: `${name} starts in ${REMINDER_LEAD_MINUTES} minutes!`,
			route: `/event-detail/${event.id}`,
		});
	}
	return planned;
}

/**
 * Schedules "10 minutes before" reminders for favorite events directly with the OS, ahead of
 * time. Unlike a foreground JS timer (which is frozen while the app is backgrounded on iOS/Android),
 * OS-scheduled notifications fire even when the app is in the background or has been killed.
 *
 * No-op on the web. Does not touch OneSignal/push — only Capacitor local notifications.
 */
@Injectable({ providedIn: 'root' })
export class EventReminderService {
	private readonly translate = inject(TranslateService);
	/** eventId -> scheduled notification id, so we can cancel when an event is unfavorited. */
	private readonly scheduled = new Map<string, number>();
	private permissionGranted = false;
	private permissionRequested = false;

	/**
	 * Reconcile OS-scheduled reminders with the current favorites: cancel reminders for events
	 * no longer favorite (or whose time passed), (re)schedule reminders for the rest. Idempotent —
	 * safe to call on every favorites change, data refresh, or language change.
	 */
	public async sync(favorites: IEvent[]): Promise<void> {
		if (!Capacitor.isNativePlatform()) {
			return;
		}
		if (!(await this.ensurePermission())) {
			return;
		}

		const planned = planEventReminders(favorites, dayjs(), this.translate.currentLang === 'cs');
		const desired = new Set(planned.map((r) => r.eventId));

		const toCancel: { id: number }[] = [];
		for (const [eventId, id] of this.scheduled) {
			if (!desired.has(eventId)) {
				toCancel.push({ id });
				this.scheduled.delete(eventId);
			}
		}
		if (toCancel.length > 0) {
			try {
				await LocalNotifications.cancel({ notifications: toCancel });
			} catch (e) {
				console.error('EventReminderService: failed to cancel reminders', e);
			}
		}

		if (planned.length === 0) {
			return;
		}

		await this.warnIfInexact();

		const notifications: LocalNotificationSchema[] = planned.map((r) => ({
			id: r.id,
			title: r.title,
			body: r.body,
			channelId: REMINDER_CHANNEL_ID,
			smallIcon: 'res://mipmap/ic_launcher',
			sound: 'default',
			schedule: { at: r.at, allowWhileIdle: true },
			extra: { actionId: ELocalNotificationAction.NAVIGATE_TO, value: r.route },
		}));

		try {
			// Scheduling reuses the deterministic id, so this also replaces a reminder whose event
			// time changed (e.g. pushed over the websocket).
			await LocalNotifications.schedule({ notifications });
			for (const r of planned) {
				this.scheduled.set(r.eventId, r.id);
			}
		} catch (e) {
			console.error('EventReminderService: failed to schedule reminders', e);
		}
	}

	private async ensurePermission(): Promise<boolean> {
		if (this.permissionGranted) {
			return true;
		}
		try {
			let status = await LocalNotifications.checkPermissions();
			if ((status.display === 'prompt' || status.display === 'prompt-with-rationale') && !this.permissionRequested) {
				this.permissionRequested = true;
				status = await LocalNotifications.requestPermissions();
			}
			this.permissionGranted = status.display === 'granted';
			return this.permissionGranted;
		} catch (e) {
			console.error('EventReminderService: permission check failed', e);
			return false;
		}
	}

	private async warnIfInexact(): Promise<void> {
		// Android 12+: exact alarms can be revoked; the plugin then falls back to inexact delivery
		// (reminders may arrive a few minutes late). Surface it for diagnostics; don't block.
		try {
			const setting = await LocalNotifications.checkExactNotificationSetting();
			if (setting.exact_alarm !== 'granted') {
				console.warn('EventReminderService: exact alarms not granted — reminders may be delayed');
			}
		} catch {
			// API unavailable on this platform/version — ignore.
		}
	}
}
