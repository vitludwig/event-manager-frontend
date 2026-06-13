import {Component, inject, OnInit} from '@angular/core';

import {ProgramService} from '../../services/program/program.service';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {TranslateModule} from '@ngx-translate/core';
import {MatTabsModule} from '@angular/material/tabs';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {QrScannerComponent} from '../../../../common/components/qr-scanner/qr-scanner.component';
import { QrCodeModule } from 'ng-qrcode';
import short from "short-uuid";

@Component({
    selector: 'app-export-favorites',
    imports: [
    QrCodeModule,
    MatButtonModule,
    MatDialogModule,
    MatSlideToggleModule,
    TranslateModule,
    MatTabsModule,
    ZXingScannerModule,
    QrScannerComponent
],
    templateUrl: './export-favorites.component.html',
    styleUrls: ['./export-favorites.component.scss']
})
export class ExportFavoritesComponent implements OnInit {
	protected favoritesData: string = "";

	#programService: ProgramService = inject(ProgramService);
	#dialogRef: MatDialogRef<void> = inject(MatDialogRef<void>);
	#translator = short();

	public ngOnInit(): void {
		this.favoritesData = JSON.stringify(this.#programService.getFavorites().map((event) => this.#translator.fromUUID(event.id)));
		console.log(this.favoritesData);
	}

	protected onCodeResult(resultString: string): void {
		const favorites = (JSON.parse(resultString) as string[]).map((obj) => this.#translator.toUUID(obj))
		this.#programService.loadFavorites(favorites);
		this.#dialogRef.close();
	}
}
