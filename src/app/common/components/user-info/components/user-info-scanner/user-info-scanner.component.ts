import { Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {TranslateModule} from '@ngx-translate/core';
import {QrScannerComponent} from '../../../qr-scanner/qr-scanner.component';

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
	],
	templateUrl: './user-info-scanner.component.html',
	styleUrls: ['./user-info-scanner.component.scss']
})
export class UserInfoScannerComponent {
	private readonly dialogRef: MatDialogRef<void> = inject(MatDialogRef<void>);

	protected onCodeResult(resultString: string): void {
		this.dialogRef.close(JSON.parse(resultString));
	}
}
