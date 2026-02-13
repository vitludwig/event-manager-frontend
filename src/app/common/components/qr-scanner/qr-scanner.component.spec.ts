import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {QrScannerComponent} from './qr-scanner.component';
import {PermissionsService} from '../../services/permissions/permissions.service';

describe('QrScannerComponent', () => {
	let component: QrScannerComponent;
	let mockPermissionsService: jasmine.SpyObj<PermissionsService>;

	beforeEach(() => {
		mockPermissionsService = jasmine.createSpyObj('PermissionsService', ['requestCameraPermissions']);
		mockPermissionsService.requestCameraPermissions.and.resolveTo(false);

		TestBed.configureTestingModule({
			imports: [QrScannerComponent, TranslateModule.forRoot()],
			providers: [
				{provide: PermissionsService, useValue: mockPermissionsService},
			],
		});

		const fixture = TestBed.createComponent(QrScannerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have cameraNotFound as false initially', () => {
		expect(component.cameraNotFound()).toBeFalse();
	});

	describe('camerasNotFoundHandler', () => {
		it('should set cameraNotFound to true', () => {
			component.camerasNotFoundHandler({});
			expect(component.cameraNotFound()).toBeTrue();
		});
	});

	describe('camerasFoundHandler', () => {
		it('should set cameras and select back camera by default', () => {
			const cameras = [
				{deviceId: 'front1', label: 'front camera'},
				{deviceId: 'back1', label: 'back camera'},
			];
			component.camerasFoundHandler(cameras);

			expect((component as any).cameras).toEqual(cameras);
			expect((component as any).currentDevice.deviceId).toBe('back1');
		});

		it('should select first camera when no back camera', () => {
			const cameras = [
				{deviceId: 'cam1', label: 'camera 1'},
				{deviceId: 'cam2', label: 'camera 2'},
			];
			component.camerasFoundHandler(cameras);

			expect((component as any).currentDevice.deviceId).toBe('cam1');
		});

		it('should prefer saved camera from localStorage', () => {
			localStorage.setItem('cameraId', 'cam2');
			const cameras = [
				{deviceId: 'cam1', label: 'back camera'},
				{deviceId: 'cam2', label: 'camera 2'},
			];
			component.camerasFoundHandler(cameras);

			expect((component as any).currentDevice.deviceId).toBe('cam2');
			localStorage.removeItem('cameraId');
		});
	});

	describe('currentDeviceId', () => {
		it('should get/set currentDevice via deviceId', () => {
			const cameras = [
				{deviceId: 'cam1', label: 'camera 1'},
				{deviceId: 'cam2', label: 'camera 2'},
			];
			component.camerasFoundHandler(cameras);

			component.currentDeviceId = 'cam2';
			expect(component.currentDeviceId).toBe('cam2');
		});
	});

	describe('handleQrCodeResult', () => {
		it('should emit scanned event', async () => {
			const spy = jasmine.createSpy('scanned');
			component.scanned.subscribe(spy);

			await component.handleQrCodeResult('test-code');

			expect(spy).toHaveBeenCalledWith('test-code');
		});
	});

	describe('ngOnInit', () => {
		it('should request camera permissions', async () => {
			await component.ngOnInit();
			expect(mockPermissionsService.requestCameraPermissions).toHaveBeenCalled();
		});
	});

	describe('cleanup', () => {
		it('should clean up interval on destroy when scanning was initialized', async () => {
			mockPermissionsService.requestCameraPermissions.and.resolveTo(true);
			spyOn(window, 'clearInterval').and.callThrough();
			const fixture2 = TestBed.createComponent(QrScannerComponent);
			fixture2.detectChanges();
			await fixture2.componentInstance.ngOnInit();
			fixture2.destroy();
			expect(window.clearInterval).toHaveBeenCalled();
		});
	});
});
