import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
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
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule],
	templateUrl: './user-info.component.html',
	styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {
	protected userInfo: IUserInfo;

	private readonly userService: UserService = inject(UserService);
	private readonly dialog: MatDialog = inject(MatDialog);

	public ngOnInit(): void {
		if(this.userService.userId && this.userService.token) {
			this.loadData(this.userService.userId, this.userService.token);
		}
	}

	protected showDetail(): void {
		this.dialog.open(UserInfoDetailComponent, {
			data: this.userInfo,
			width: '500px',
		});
	}

	protected openScanner(): void {
		const dialog = this.dialog.open(UserInfoScannerComponent, {
			data: this.userInfo,
			width: '500px',
		});
		dialog.afterClosed().subscribe((result: IUserInfoTerminal) => {
			this.userService.userId = result.userId;
			this.userService.token = result.token;

			this.loadData(this.userService.userId, this.userService.token);
		});
	}

	private async loadData(userId: number, token: string): Promise<void> {
		this.userInfo = await this.userService.getUserInfo(userId, token);
	}
}
