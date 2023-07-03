export interface IOneSignalNotificationsResponse {
	limit: number;
	offset: number;
	total_count: number;
	notifications: IOneSignalNotification[];
}

// This is only partial interface, with only relevant properties for our app
export interface IOneSignalNotification {
	id: string;
	contents: Record<string, string>; // {cs: string, en: string},
	headings: Record<string, string>; // {cs: string, en: string}
	included_segments: string[];
}
