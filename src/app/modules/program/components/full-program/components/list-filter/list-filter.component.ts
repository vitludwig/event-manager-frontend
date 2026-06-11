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
import {IProgramPlace} from '../../../../types/IProgramPlace';
import {LocalizedNamePipe} from '../../../../pipes/localized-name/localized-name.pipe';
import {localizedName} from '../../../../pipes/localized-name/localized-name';

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
    TranslateModule,
    LocalizedNamePipe,
],
    templateUrl: './list-filter.component.html',
    styleUrls: ['./list-filter.component.scss']
})
export class ListFilterComponent {
	protected translate: TranslateService = inject(TranslateService);
	protected programService: ProgramService = inject(ProgramService);
	#data: { options: IProgramFilterOptions } = inject(MAT_DIALOG_DATA);
	#dialogRef: MatDialogRef<ListFilterComponent, IProgramFilterOptions> = inject(MatDialogRef<ListFilterComponent, IProgramFilterOptions>);

	protected places: IProgramPlace[] = [...this.programService.allPlaces]
		.sort((a, b) => localizedName(a, this.translate.currentLang)
			.localeCompare(localizedName(b, this.translate.currentLang), this.translate.currentLang));
	protected eventTypes: IEventType[] = [...this.programService.eventTypes()]
		.sort((a, b) => localizedName(a, this.translate.currentLang)
			.localeCompare(localizedName(b, this.translate.currentLang), this.translate.currentLang));
	protected tags: IEventTag[] = [...this.programService.tags]
		.sort((a, b) => this.tagLabel(a).localeCompare(this.tagLabel(b), this.translate.currentLang));
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

	private tagLabel(tag: IEventTag): string {
		return this.translate.currentLang === 'cs' ? tag.nameCs : (tag.nameEn ?? tag.nameCs);
	}
}
