import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {QRCodeModule} from 'angularx-qrcode';
import {ProgramService} from '../../services/program/program.service';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {TranslateModule} from '@ngx-translate/core';
import {MatTabsModule} from '@angular/material/tabs';
import {ZXingScannerModule} from '@zxing/ngx-scanner';

@Component({
	selector: 'app-export-favorites',
	standalone: true,
	imports: [
		CommonModule,
		QRCodeModule,
		MatButtonModule,
		MatDialogModule,
		MatSlideToggleModule,
		TranslateModule,
		MatTabsModule,
		ZXingScannerModule,
	],
	templateUrl: './export-favorites.component.html',
	styleUrls: ['./export-favorites.component.scss']
})
export class ExportFavoritesComponent implements OnInit {
	protected favoritesData: string;
	protected code: string;

	#programService: ProgramService = inject(ProgramService);
	#dialogRef: MatDialogRef<void> = inject(MatDialogRef<void>);

	public ngOnInit(): void {
		this.favoritesData = JSON.stringify(this.#programService.getFavorites().map((event) => event.id));
	}

	protected onCodeResult(resultString: string): void {
		console.log('code', resultString);
		this.code = resultString;
		this.#programService.loadFavorites(JSON.parse(resultString));
		this.#dialogRef.close();
	}
}
