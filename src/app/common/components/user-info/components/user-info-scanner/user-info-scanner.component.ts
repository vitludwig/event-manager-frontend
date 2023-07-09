import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {QRCodeModule} from 'angularx-qrcode';
import {TranslateModule} from '@ngx-translate/core';
import {ZXingScannerModule} from '@zxing/ngx-scanner';

@Component({
	selector: 'app-user-info-scanner',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatDialogModule, MatTabsModule, QRCodeModule, TranslateModule, ZXingScannerModule],
	templateUrl: './user-info-scanner.component.html',
	styleUrls: ['./user-info-scanner.component.scss']
})
export class UserInfoScannerComponent {
	private readonly dialogRef: MatDialogRef<void> = inject(MatDialogRef<void>);

	protected onCodeResult(resultString: string): void {
		this.dialogRef.close(JSON.parse(resultString));
	}
}
