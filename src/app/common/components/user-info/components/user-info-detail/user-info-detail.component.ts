import {Component, EventEmitter, inject, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {TranslateModule} from '@ngx-translate/core';
import {MatListModule} from '@angular/material/list';
import {IUserInfo} from '../../types/IUserInfo';
import {UserService} from '../../../../services/user/user.service';

@Component({
	selector: 'app-user-info-detail',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatOptionModule, MatSelectModule, MatSlideToggleModule, TranslateModule, MatListModule],
	templateUrl: './user-info-detail.component.html',
	styleUrls: ['./user-info-detail.component.scss']
})
export class UserInfoDetailComponent {
	@Output()
	public refresh: EventEmitter<void> = new EventEmitter<void>();

	protected readonly dialogData: {refreshFn: () => void; data: IUserInfo} = inject(MAT_DIALOG_DATA);
	protected readonly userService: UserService = inject(UserService);

	protected refreshData(): void {
		this.dialogData.refreshFn();
	}
}
