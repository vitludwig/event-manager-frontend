import {TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {UserInfoScannerComponent} from './user-info-scanner.component';
import {PermissionsService} from '../../../../services/permissions/permissions.service';

describe('UserInfoScannerComponent', () => {
	let component: UserInfoScannerComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [UserInfoScannerComponent, NoopAnimationsModule, TranslateModule.forRoot()],
			providers: [
				{provide: MatDialogRef, useValue: {close: jasmine.createSpy('close')}},
				{provide: PermissionsService, useValue: {requestCameraPermissions: jasmine.createSpy().and.resolveTo(false)}},
			],
		});
		const fixture = TestBed.createComponent(UserInfoScannerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
