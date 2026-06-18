import dayjs from 'dayjs';

import { IEvent } from '../../../program/types/IEvent';
import { planEventReminders, reminderNotificationId } from './event-reminder.service';

function mockEvent(overrides: Partial<IEvent> = {}): IEvent {
	return {
		id: 'e1',
		nameCs: 'Koncert',
		nameEn: 'Concert',
		descriptionCs: '',
		descriptionEn: '',
		startAt: '2026-07-10T20:00:00Z',
		endAt: '2026-07-10T22:00:00Z',
		locationId: 'p1',
		location: {id: 'p1', name: 'Stage'},
		favorite: true,
		eventType: {id: 't1', name: 'Concert', color: '#f00'},
		tags: [],
		...overrides,
	};
}

describe('planEventReminders', () => {
	const now = dayjs('2026-07-10T12:00:00Z');

	it('plans a reminder 10 minutes before a future event', () => {
		const plans = planEventReminders([mockEvent({id: 'e1', startAt: '2026-07-10T20:00:00Z'})], now, true);
		expect(plans.length).toBe(1);
		expect(dayjs(plans[0].at).toISOString()).toBe('2026-07-10T19:50:00.000Z');
		expect(plans[0].eventId).toBe('e1');
		expect(plans[0].route).toBe('/event-detail/e1');
	});

	it('skips events whose reminder time is already in the past', () => {
		// Event starts in 5 minutes → reminder time (−10 min) is in the past.
		const plans = planEventReminders([mockEvent({startAt: now.add(5, 'minute').toISOString()})], now, true);
		expect(plans.length).toBe(0);
	});

	it('uses Czech / English text by language', () => {
		const cs = planEventReminders([mockEvent()], now, true)[0];
		expect(cs.title).toBe('Nadcházející akce');
		expect(cs.body).toContain('Koncert');

		const en = planEventReminders([mockEvent()], now, false)[0];
		expect(en.title).toBe('Upcoming event');
		expect(en.body).toContain('Concert');
	});

	it('falls back to the Czech name when the English name is empty', () => {
		const en = planEventReminders([mockEvent({nameEn: ''})], now, false)[0];
		expect(en.body).toContain('Koncert');
	});
});

describe('reminderNotificationId', () => {
	it('is deterministic and stable for the same event id', () => {
		expect(reminderNotificationId('event-123')).toBe(reminderNotificationId('event-123'));
	});

	it('produces a positive 31-bit integer', () => {
		const id = reminderNotificationId('some-long-event-uuid-abc-def');
		expect(Number.isInteger(id)).toBeTrue();
		expect(id).toBeGreaterThanOrEqual(0);
		expect(id).toBeLessThan(2147483647);
	});

	it('differs for different event ids', () => {
		expect(reminderNotificationId('e1')).not.toBe(reminderNotificationId('e2'));
	});
});
