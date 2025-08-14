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
import {IProgramFilterOptions} from '../../types/IProgramFilterOptions';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {IEventType} from '../../../../types/IEventType';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {IEventTag} from "../../../../types/IEventTag";

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
	protected eventTypes: IEventType[] = [];
	protected tags: IEventTag[] = [];

	protected placeId: string[] | undefined;
	protected selectedEventType: string[] | undefined;
	protected selectedTags: string[] | undefined;
	protected onlyFavorite: boolean = false;

	protected translate: TranslateService = inject(TranslateService);
	protected programService: ProgramService = inject(ProgramService);
	#data: { options: IProgramFilterOptions } = inject(MAT_DIALOG_DATA);
	#dialogRef: MatDialogRef<ListFilterComponent, IProgramFilterOptions> = inject(MatDialogRef<ListFilterComponent, IProgramFilterOptions>);


	public ngOnInit(): void {
		this.eventTypes = this.programService.eventTypes;
		this.tags = this.programService.tags;

		this.placeId = this.#data.options.placeId ?? undefined;
		this.selectedEventType = this.#data.options.eventType ?? undefined;
		this.selectedTags = this.#data.options.tags ?? undefined;
		this.onlyFavorite = this.#data.options.onlyFavorite ?? false;
	}

	protected applyFilters(): void {
		this.selectedEventType = this.selectedEventType?.length ? this.selectedEventType : undefined;
		this.placeId = this.placeId?.length ? this.placeId : undefined;

		this.#dialogRef.close({
			eventType: this.selectedEventType,
			placeId: this.placeId,
			onlyFavorite: this.onlyFavorite,
			tags: this.selectedTags,
		});
	}

	protected resetFilters(): void {
		this.selectedEventType = undefined;
		this.placeId = undefined;
		this.onlyFavorite = false;
		this.selectedTags = undefined;

		this.applyFilters();
	}
}
