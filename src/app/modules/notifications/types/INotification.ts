export interface INotification {
	id: string;
	text?: string;
	type: number;
	target: unknown;
	eventId?: string;
	changedProperties?: string;
	created: string;
}

export interface INotificationProperty {
	name: string;
	value: string;
}
