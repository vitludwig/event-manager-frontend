import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {UserService} from '../../services/user/user.service';
import {MatDialog} from '@angular/material/dialog';
import {UserInfoDetailComponent} from './components/user-info-detail/user-info-detail.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {UserInfoScannerComponent} from './components/user-info-scanner/user-info-scanner.component';
import {IUserInfo} from './types/IUserInfo';
import {IUserInfoTerminal} from './types/IUserInfoTerminal';

@Component({
    selector: 'app-user-info',
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './user-info.component.html',
    styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {
	protected readonly userInfo = signal<IUserInfo | undefined>(undefined);

	private readonly userService: UserService = inject(UserService);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly destroyRef: DestroyRef = inject(DestroyRef);

	public ngOnInit(): void {
		if(this.userService.userId && this.userService.walletToken) {
			this.loadData();

			const intervalId = setInterval(() => {
				this.loadData();
			}, 600000);

			this.destroyRef.onDestroy(() => clearInterval(intervalId));
		}
	}

	protected showDetail(): void {
		this.dialog.open(UserInfoDetailComponent, {
			data: {
				data: this.userInfo(),
				refreshFn: this.loadData
			},
			width: '500px',
		});
	}

	protected openScanner(): void {
		const dialog = this.dialog.open(UserInfoScannerComponent, {
			data: this.userInfo(),
			width: '500px',
		});

		dialog.afterClosed().pipe(
			takeUntilDestroyed(this.destroyRef),
		).subscribe((result: IUserInfoTerminal) => {
			if(result) {
				this.userService.userId = result.userId;
				this.userService.walletToken = result.token;
				this.loadData();
			}
		});
	}

	private loadData = async (): Promise<void> => {
		if(this.userService.userId && this.userService.walletToken) {
			try {
				this.userInfo.set(await this.userService.getUserInfo(this.userService.userId, this.userService.walletToken));
				this.userService.lastChecked = new Date().toString();
			} catch(e) {
				console.error(e);
			}
		}
	}
}
