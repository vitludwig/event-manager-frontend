export interface IEvent {
	id: string;
	name: string;
	description: string;
	image?: string;
	start: number;
	end: number;
	placeId: string;
	favorite: boolean;
}
