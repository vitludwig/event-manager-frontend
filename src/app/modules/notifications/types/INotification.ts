export interface INotification {
	id: string;
	text?: string;
	type: number;
	target: unknown;
	eventId?: string;
	changedProperties?: INotificationProperty[];
	created: string;
}

export interface INotificationProperty {
	name: string;
	value: string;
}
