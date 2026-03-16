import {Component, inject} from '@angular/core';

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
    imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslateModule
],
    templateUrl: './list-filter.component.html',
    styleUrls: ['./list-filter.component.scss']
})
export class ListFilterComponent {
	protected translate: TranslateService = inject(TranslateService);
	protected programService: ProgramService = inject(ProgramService);
	#data: { options: IProgramFilterOptions } = inject(MAT_DIALOG_DATA);
	#dialogRef: MatDialogRef<ListFilterComponent, IProgramFilterOptions> = inject(MatDialogRef<ListFilterComponent, IProgramFilterOptions>);

	protected eventTypes: IEventType[] = this.programService.eventTypes;
	protected tags: IEventTag[] = this.programService.tags;
	protected locationId: string[] | undefined = this.#data.options.locationId ?? undefined;
	protected selectedEventType: string[] | undefined = this.#data.options.eventType ?? undefined;
	protected selectedTags: string[] | undefined = this.#data.options.tags ?? undefined;
	protected onlyFavorite: boolean = this.#data.options.onlyFavorite ?? false;

	protected applyFilters(): void {
		this.selectedEventType = this.selectedEventType?.length ? this.selectedEventType : undefined;
		this.locationId = this.locationId?.length ? this.locationId : undefined;

		this.#dialogRef.close({
			eventType: this.selectedEventType,
			locationId: this.locationId,
			onlyFavorite: this.onlyFavorite,
			tags: this.selectedTags,
		});
	}

	protected resetFilters(): void {
		this.selectedEventType = undefined;
		this.locationId = undefined;
		this.onlyFavorite = false;
		this.selectedTags = undefined;

		this.applyFilters();
	}
}
