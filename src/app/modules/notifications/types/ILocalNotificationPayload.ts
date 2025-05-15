export interface ILocalNotificationPayload {
    actionId: ELocalNotificationAction;
    value: string | number;
}

export enum ELocalNotificationAction {
    NAVIGATE_TO = 'navigateTo',
}