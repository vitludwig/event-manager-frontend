import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ZXingScannerComponent, ZXingScannerModule} from '@zxing/ngx-scanner';
import {Subject, takeUntil} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatSelectModule} from '@angular/material/select';
import {MatDialogModule} from '@angular/material/dialog';

@Component({
	selector: 'app-qr-scanner',
	standalone: true,
	imports: [
		CommonModule,
		ZXingScannerModule,
		FormsModule,
		TranslateModule,
		MatSelectModule,
		MatDialogModule,
	],
	templateUrl: './qr-scanner.component.html',
	styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent implements OnInit, OnDestroy {
	@ViewChild('scanner')
	public scanner!: ZXingScannerComponent;

	get currentDeviceId(): string {
		return this.currentDevice?.deviceId;
	}

	set currentDeviceId(value: string) {
		this.currentDevice = this.cameras.find((device) => device.deviceId === value);
	}

	public cameraNotFound: boolean = false;

	@Output()
	public scanned: EventEmitter<string> = new EventEmitter();

	protected cameras: any[] = [];
	protected currentDevice: any = null;

	protected tryScannerInterval: number | null = null;
	protected destroy: Subject<void> = new Subject<void>();

	public ngOnInit() {
		this.tryScannerInterval = window.setInterval(() => {
			if(!this.scanner) {
				return;
			}

			// @ts-ignore
			this.cameraNotFound = !this.scanner.hasPermission;
			if(this.scanner.permissionResponse) {
				this.scanner.permissionResponse.pipe(takeUntil(this.destroy)).subscribe((value) => {
					this.cameraNotFound = !value;
				});
			}
			clearInterval(this.tryScannerInterval!);
		}, 333);
	}

	public ngOnDestroy() {
		if(this.tryScannerInterval) {
			clearInterval(this.tryScannerInterval);
		}
		this.destroy.next();
		this.destroy.complete();
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
		this.cameraNotFound = true;
	}
}
