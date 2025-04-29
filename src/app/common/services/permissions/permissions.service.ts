import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {Camera} from "@capacitor/camera";

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
}
