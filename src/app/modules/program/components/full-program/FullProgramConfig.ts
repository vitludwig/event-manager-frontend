import {IEventType} from '../../types/IEventType';

export class FullProgramConfig {
	/**
	 * Width of program n-minutes segment in px
	 */
	public static segmentWidth: number = 45;

	/**
	 * Time duration of segment in minutes
	 */
	public static segmentDuration: number = 15;

	public static eventTypes: Record<number, IEventType> = {
		0: {
			id: 0,
			name: 'Soutěž/Turnaj/Larp',
			color: '#C5C7C6',
			abbr: 'S',
		},
		1: {
			id: 1,
			name: 'Živá hudba',
			color: '#e7503d',
			abbr: 'H',
		},
		2: {
			id: 2,
			name: 'Elektronická hudba (DJs)',
			color: '#318C9F',
			abbr: 'E',
		},
		3: {
			id: 3,
			name: 'Film',
			color: '#afcb1f',
			abbr: 'F',
		},
		4: {
			id: 4,
			name: 'Show/Vystoupení',
			color: '#7d71b1',
			abbr: 'V',
		},
		5: {
			id: 5,
			name: 'Workshop',
			color: '#ffcc01',
			abbr: 'WS',
		},
		6: {
			id: 6,
			name: 'Přednáška',
			color: '#ef7f1b',
			abbr: 'P',
		},
		7: {
			id: 7,
			name: 'Kmenový program',
			color: '#917400',
			abbr: 'P',
		},
	}
}
