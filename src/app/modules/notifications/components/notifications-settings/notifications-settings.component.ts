import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {INotificationSettings} from '../../types/INotificationSettings';
import {TranslateModule} from '@ngx-translate/core';

@Component({
	selector: 'app-notifications-settings',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatDialogModule,
		MatFormFieldModule,
		MatOptionModule,
		MatSelectModule,
		MatSlideToggleModule,
		TranslateModule,
	],
	templateUrl: './notifications-settings.component.html',
	styleUrls: ['./notifications-settings.component.scss']
})
export class NotificationsSettingsComponent {

	constructor(@Inject(MAT_DIALOG_DATA) public data: INotificationSettings) {
	}
}
