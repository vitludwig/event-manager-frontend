import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {ProgramService} from '../../../../services/program/program.service';
import {IProgramPlace} from '../../../../types/IProgramPlace';
import {Observable} from 'rxjs';
import {EEventType} from '../../../../types/EEventType';
import {IProgramFilterOptions} from '../../types/IProgramFilterOptions';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

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
	],
	templateUrl: './list-filter.component.html',
	styleUrls: ['./list-filter.component.scss']
})
export class ListFilterComponent {
	protected places$: Observable<IProgramPlace[]>;
	protected eventTypes: Record<EEventType, string> = {
		[EEventType.WORKSHOP]: 'Workshop',
		[EEventType.LECTURE]: 'Lecture',
		[EEventType.CONCERT]: 'Concert',
		[EEventType.OTHER]: 'Other',
	}

	protected placeId: string[] | null = null;
	protected eventType: EEventType[] | null = null;
	protected onlyFavorite: boolean = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { options: IProgramFilterOptions },
		private programService: ProgramService,
		private dialogRef: MatDialogRef<ListFilterComponent, IProgramFilterOptions>,
	) {
		this.places$ = this.programService.places$;
		this.placeId = data.options.placeId ?? null;
		this.eventType = data.options.eventType ?? null;
		this.onlyFavorite = data.options.onlyFavorite ?? false;
	}

	protected applyFilters(): void {
		this.eventType = this.eventType?.length ? this.eventType : null;
		this.placeId = this.placeId?.length ? this.placeId : null;

		this.dialogRef.close({
			eventType: this.eventType,
			placeId: this.placeId,
			onlyFavorite: this.onlyFavorite,
		});
	}

	protected resetFilters(): void {
		this.eventType = null;
		this.placeId = null;
		this.onlyFavorite = false;
		this.applyFilters();
	}
}
