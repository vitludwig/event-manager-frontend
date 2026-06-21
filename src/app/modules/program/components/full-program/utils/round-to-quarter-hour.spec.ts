import dayjs from 'dayjs';
import {roundToQuarterHour} from './round-to-quarter-hour';

describe('roundToQuarterHour', () => {
	function at(time: string): string {
		return roundToQuarterHour(dayjs(`2026-06-21T${time}`));
	}

	it('keeps an exact quarter hour unchanged', () => {
		expect(at('14:00:00')).toBe('14:00');
		expect(at('14:15:00')).toBe('14:15');
	});

	it('rounds down within the lower half of the interval', () => {
		expect(at('14:07:00')).toBe('14:00');
		expect(at('14:22:00')).toBe('14:15');
		expect(at('14:52:00')).toBe('14:45');
	});

	it('rounds up within the upper half of the interval', () => {
		expect(at('14:08:00')).toBe('14:15');
		expect(at('14:38:00')).toBe('14:45');
	});

	it('carries into the next hour when minutes round up to 60', () => {
		expect(at('14:53:00')).toBe('15:00');
		expect(at('14:57:00')).toBe('15:00');
		expect(at('14:59:00')).toBe('15:00');
	});

	it('wraps to 00:00 at the end of the day', () => {
		expect(at('23:58:00')).toBe('00:00');
	});

	it('always returns a value on a 15-minute boundary', () => {
		for (let h = 0; h < 24; h++) {
			for (let m = 0; m < 60; m++) {
				const minutes = parseInt(roundToQuarterHour(dayjs(`2026-06-21T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)).split(':')[1], 10);
				expect(minutes % 15).toBe(0);
			}
		}
	});
});
