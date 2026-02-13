import {Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ZXingScannerComponent, ZXingScannerModule} from '@zxing/ngx-scanner';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {MatSelectModule} from '@angular/material/select';
import {MatDialogModule} from '@angular/material/dialog';
import {PermissionsService} from "../../services/permissions/permissions.service";

@Component({
    selector: 'app-qr-scanner',
    imports: [
        ZXingScannerModule,
        FormsModule,
        TranslateModule,
        MatSelectModule,
        MatDialogModule,
    ],
    templateUrl: './qr-scanner.component.html',
    styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent implements OnInit {
    private readonly permissionsService: PermissionsService = inject(PermissionsService);
    private readonly destroyRef: DestroyRef = inject(DestroyRef);

    @ViewChild('scanner')
    public scanner!: ZXingScannerComponent;

    get currentDeviceId(): string {
        return this.currentDevice?.deviceId;
    }

    set currentDeviceId(value: string) {
        this.currentDevice = this.cameras.find((device) => device.deviceId === value);
    }

    public cameraNotFound = signal(false);

    @Output()
    public scanned: EventEmitter<string> = new EventEmitter();

    protected cameras: any[] = [];
    protected currentDevice: any = null;

    public async ngOnInit() {
        const hasCameraPermission = await this.permissionsService.requestCameraPermissions();

        if (hasCameraPermission) {
            this.initScanning()
        }
    }

    private initScanning() {
        const intervalId = window.setInterval(() => {
            if (!this.scanner) {
                return;
            }

            // @ts-ignore
            this.cameraNotFound.set(!this.scanner.hasPermission);
            if (this.scanner.permissionResponse) {
                this.scanner.permissionResponse.pipe(
                    takeUntilDestroyed(this.destroyRef),
                ).subscribe((value) => {
                    this.cameraNotFound.set(!value);
                });
            }
            clearInterval(intervalId);
        }, 333);

        this.destroyRef.onDestroy(() => clearInterval(intervalId));
    }

    public camerasFoundHandler($event: any[]) {
        const defaultCamera = $event.find((device) => device.deviceId === localStorage.getItem('cameraId'));
        this.cameras = $event;
        const backCamera = $event.find((obj) => obj.label.includes('back')) ?? $event[0]
        this.currentDevice = defaultCamera ?? backCamera;
    }

    public async handleQrCodeResult(resultString: string): Promise<void> {
        this.scanned.emit(resultString);
    }

    public camerasNotFoundHandler($event: any) {
        this.cameraNotFound.set(true);
    }
}
