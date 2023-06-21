import {IEventType} from '../../types/IEventType';

export class FullProgramConfig {
	/**
	 * Width of program n-minutes segment in px
	 */
	public static segmentWidth: number = 80;

	/**
	 * Time duration of segment in minutes
	 */
	public static segmentDuration: number = 15;
	public typeNames = [
		'Soutěž/Turnaj/Larp',
		'Živá hudba',
		'Elektronická hudba (DJs)',
		'Film',
		'Show/Vystoupení',
		'Workshop',
		'Přednáška',
	]

	public static eventTypes: Record<number, IEventType> = {
		0: {
			id: 0,
			name: 'Soutěž/Turnaj/Larp',
			color: '#C5C7C6'
		},
		1: {
			id: 1,
			name: 'Živá hudba',
			color: '#e7503d'
		},
		2: {
			id: 2,
			name: 'Elektronická hudba (DJs)',
			color: '#6f777e'
		},
		3: {
			id: 3,
			name: 'Film',
			color: '#afcb1f'
		},
		4: {
			id: 4,
			name: 'Show/Vystoupení',
			color: '#7d71b1'
		},
		5: {
			id: 5,
			name: 'Workshop',
			color: '#ffcc01'
		},
		6: {
			id: 6,
			name: 'Přednáška',
			color: '#ef7f1b'
		},
	}
}
