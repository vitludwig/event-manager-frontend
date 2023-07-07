import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {ProgramService} from '../../../../services/program/program.service';
import {EEventType} from '../../../../types/EEventType';
import {IProgramFilterOptions} from '../../types/IProgramFilterOptions';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FullProgramConfig} from '../../FullProgramConfig';
import {IEventType} from '../../../../types/IEventType';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-list-filter',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatButtonModule,
		MatDialogModule,
		MatDividerModule,
		MatIconModule,
		MatFormFieldModule,
		MatSelectModule,
		MatSlideToggleModule,
		TranslateModule,
	],
	templateUrl: './list-filter.component.html',
	styleUrls: ['./list-filter.component.scss']
})
export class ListFilterComponent implements OnInit {
	protected eventTypes: IEventType[] = Object.values(FullProgramConfig.eventTypes);
	protected placeId: string[] | undefined;
	protected eventType: EEventType[] | undefined;
	protected onlyFavorite: boolean = false;

	protected translate: TranslateService = inject(TranslateService);
	protected programService: ProgramService = inject(ProgramService);
	#data: { options: IProgramFilterOptions } = inject(MAT_DIALOG_DATA);
	#dialogRef: MatDialogRef<ListFilterComponent, IProgramFilterOptions> = inject(MatDialogRef<ListFilterComponent, IProgramFilterOptions>);


	public ngOnInit(): void {
		this.placeId = this.#data.options.placeId ?? undefined;
		this.eventType = this.#data.options.eventType ?? undefined;
		this.onlyFavorite = this.#data.options.onlyFavorite ?? false;
	}

	protected applyFilters(): void {
		this.eventType = this.eventType?.length ? this.eventType : undefined;
		this.placeId = this.placeId?.length ? this.placeId : undefined;

		this.#dialogRef.close({
			eventType: this.eventType,
			placeId: this.placeId,
			onlyFavorite: this.onlyFavorite,
		});
	}

	protected resetFilters(): void {
		this.eventType = undefined;
		this.placeId = undefined;
		this.onlyFavorite = false;
		this.applyFilters();
	}
}
