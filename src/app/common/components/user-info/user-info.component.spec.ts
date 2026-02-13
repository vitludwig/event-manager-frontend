import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {of} from 'rxjs';

import {UserInfoComponent} from './user-info.component';
import {UserService} from '../../services/user/user.service';
import {IUserInfo} from './types/IUserInfo';

describe('UserInfoComponent', () => {
	let component: UserInfoComponent;
	let mockUserService: any;
	let mockDialog: jasmine.SpyObj<MatDialog>;

	const mockUserInfo: IUserInfo = {
		user: {
			Name: 'Test User',
			MemberId: '123',
			Email: 'test@example.com',
			DepositSum: 100,
			BuySum: 50,
			WithdrawSum: 0,
			TotalSum: 50,
		},
		transactions: [],
	};

	beforeEach(() => {
		mockUserService = {
			userId: undefined as number | undefined,
			walletToken: undefined as string | undefined,
			lastChecked: '',
			getUserInfo: jasmine.createSpy('getUserInfo').and.resolveTo(mockUserInfo),
		};

		mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

		TestBed.configureTestingModule({
			imports: [UserInfoComponent],
			providers: [
				{provide: UserService, useValue: mockUserService},
				{provide: MatDialog, useValue: mockDialog},
			],
		});
	});

	function createComponent() {
		const fixture = TestBed.createComponent(UserInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		return fixture;
	}

	it('should create', () => {
		createComponent();
		expect(component).toBeTruthy();
	});

	it('should have undefined userInfo initially', () => {
		createComponent();
		expect((component as any).userInfo()).toBeUndefined();
	});

	describe('when user has credentials', () => {
		beforeEach(() => {
			mockUserService.userId = 42;
			mockUserService.walletToken = 'token123';
		});

		it('should load user data on init', fakeAsync(() => {
			createComponent();
			tick();
			expect(mockUserService.getUserInfo).toHaveBeenCalledWith(42, 'token123');
			expect((component as any).userInfo()).toEqual(mockUserInfo);
		}));

		it('should set lastChecked after loading', fakeAsync(() => {
			createComponent();
			tick();
			expect(mockUserService.lastChecked).toBeTruthy();
		}));

		it('should set up refresh interval', fakeAsync(() => {
			createComponent();
			tick();
			mockUserService.getUserInfo.calls.reset();

			tick(600000);
			expect(mockUserService.getUserInfo).toHaveBeenCalled();
		}));

		it('should clean up interval on destroy', fakeAsync(() => {
			const fixture = createComponent();
			tick();
			mockUserService.getUserInfo.calls.reset();

			fixture.destroy();
			tick(600000);

			expect(mockUserService.getUserInfo).not.toHaveBeenCalled();
		}));

		it('should handle getUserInfo error gracefully', fakeAsync(() => {
			mockUserService.getUserInfo.and.rejectWith(new Error('Network error'));
			spyOn(console, 'error');
			createComponent();
			tick();
			expect(console.error).toHaveBeenCalled();
			expect((component as any).userInfo()).toBeUndefined();
		}));
	});

	describe('when user has no credentials', () => {
		it('should not load data on init', fakeAsync(() => {
			createComponent();
			tick();
			expect(mockUserService.getUserInfo).not.toHaveBeenCalled();
		}));

		it('should not set up interval', fakeAsync(() => {
			createComponent();
			tick();
			tick(600000);
			expect(mockUserService.getUserInfo).not.toHaveBeenCalled();
		}));
	});

	describe('showDetail', () => {
		it('should open detail dialog with userInfo', fakeAsync(() => {
			mockUserService.userId = 42;
			mockUserService.walletToken = 'token123';
			createComponent();
			tick();

			(component as any).showDetail();

			expect(mockDialog.open).toHaveBeenCalledWith(
				jasmine.any(Function),
				jasmine.objectContaining({width: '500px'}),
			);
		}));
	});

	describe('openScanner', () => {
		it('should open scanner dialog', () => {
			const mockDialogRef = {afterClosed: () => of(undefined)};
			mockDialog.open.and.returnValue(mockDialogRef as any);
			createComponent();

			(component as any).openScanner();

			expect(mockDialog.open).toHaveBeenCalled();
		});

		it('should update credentials when scanner returns result', fakeAsync(() => {
			const scanResult = {userId: 99, token: 'new-token'};
			const mockDialogRef = {afterClosed: () => of(scanResult)};
			mockDialog.open.and.returnValue(mockDialogRef as any);
			createComponent();

			(component as any).openScanner();
			tick();

			expect(mockUserService.userId).toBe(99);
			expect(mockUserService.walletToken).toBe('new-token');
		}));

		it('should not update credentials when scanner is cancelled', fakeAsync(() => {
			const mockDialogRef = {afterClosed: () => of(undefined)};
			mockDialog.open.and.returnValue(mockDialogRef as any);
			createComponent();

			(component as any).openScanner();
			tick();

			expect(mockUserService.userId).toBeUndefined();
		}));
	});
});
