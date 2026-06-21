import {Dayjs} from 'dayjs';

/**
 * Rounds a time to the nearest 15-minute boundary and returns it as "HH:mm".
 *
 * Works on the absolute minute-of-day so rounding carries correctly across the
 * hour (e.g. 14:57 → 15:00) and the day (e.g. 23:58 → 00:00) boundaries.
 */
export function roundToQuarterHour(now: Dayjs): string {
	const minuteOfDay = now.hour() * 60 + now.minute();
	const rounded = Math.round(minuteOfDay / 15) * 15;
	return now.startOf('day').add(rounded, 'minute').format('HH:mm');
}
