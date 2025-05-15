import {Injectable} from '@angular/core';
import {Capacitor} from '@capacitor/core';
import {Camera} from "@capacitor/camera";
import {LocalNotifications, PermissionStatus,} from '@capacitor/local-notifications';

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {

    public async requestCameraPermissions(): Promise<boolean> {
        if (Capacitor.getPlatform() === 'android') {
            const cameraPermission = await Camera.requestPermissions();
            return cameraPermission.camera === 'granted';
        }
        return true;
    }

    public async hasLocalNotificationPermissions(): Promise<boolean> {
        const status: PermissionStatus = await LocalNotifications.checkPermissions();
        return status.display === 'granted';
    }

    public async requestLocalNotificationPermissions(): Promise<boolean> {
        const status: PermissionStatus = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    }
}
