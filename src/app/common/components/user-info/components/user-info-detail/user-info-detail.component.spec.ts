import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {UserInfoDetailComponent} from './user-info-detail.component';
import {UserService} from '../../../../services/user/user.service';

describe('UserInfoDetailComponent', () => {
	let component: UserInfoDetailComponent;

	const mockUserService = {
		lastChecked: new Date().toISOString(),
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [UserInfoDetailComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {refreshFn: () => {}, data: {user: {Name: 'Test', TotalSum: 0}, transactions: []}}},
				{provide: UserService, useValue: mockUserService},
			],
		});
		const fixture = TestBed.createComponent(UserInfoDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
