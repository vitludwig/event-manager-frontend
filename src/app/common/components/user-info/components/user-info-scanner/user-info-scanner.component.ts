import { Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';
import {QrScannerComponent} from '../../../qr-scanner/qr-scanner.component';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {AutoUppercaseDirective} from "../../../../directives/auto-uppercase.directive";

@Component({
	selector: 'app-user-info-scanner',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatDialogModule,
		MatTabsModule,
		TranslateModule,
		QrScannerComponent,
		MatFormField,
		MatInput,
		MatIconModule,
		AutoUppercaseDirective,
	],
	templateUrl: './user-info-scanner.component.html',
	styleUrls: ['./user-info-scanner.component.scss']
})
export class UserInfoScannerComponent {
	private readonly dialogRef: MatDialogRef<void> = inject(MatDialogRef<void>);

	protected onCodeResult(resultString: string): void {
		if(!resultString) {
			return;
		}

		const userId = resultString.substring(0, resultString.length - 6);
		const token = resultString.slice(-6)
		this.dialogRef.close({userId, token});
	}
}
