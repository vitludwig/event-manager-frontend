import {Component, computed, inject, signal, Signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs';
import {ProgramService} from '../../services/program/program.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateEventPropertyPipe} from '../../pipes/translate-event-property/translate-event-property.pipe';
import {EventTagsComponent} from "../event-tags/event-tags.component";
import {LocalizedNamePipe} from '../../pipes/localized-name/localized-name.pipe';
import {IEvent} from '../../types/IEvent';
import {IProgramPlace} from '../../types/IProgramPlace';
import {ERoute} from '../../../../common/types/ERoute';

interface IEventDetailDialogData {
    event: IEvent;
    place: IProgramPlace;
}

@Component({
    selector: 'app-event-detail-full',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        TranslateModule,
        TranslateEventPropertyPipe,
        EventTagsComponent,
        LocalizedNamePipe,
    ],
    templateUrl: './event-detail-full.component.html',
    styleUrls: ['./event-detail-full.component.scss']
})
export class EventDetailFullComponent {
	protected readonly programService: ProgramService = inject(ProgramService);
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly router: Router = inject(Router);
	// Present only when opened as a MatDialog. Absent when navigated to (deep link /
	// notification tap) — then we resolve the event from the route :id instead.
	private readonly dialogData = inject<IEventDetailDialogData | null>(MAT_DIALOG_DATA, {optional: true});
	private readonly dialogRef = inject<MatDialogRef<EventDetailFullComponent> | null>(MatDialogRef, {optional: true});
	private readonly route = inject(ActivatedRoute, {optional: true});

	private readonly routeEventId: Signal<string | null> = this.route
		? toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {initialValue: null})
		: signal<string | null>(null);

	protected readonly event: Signal<IEvent | undefined> = computed(() => {
		if (this.dialogData) {
			return this.dialogData.event;
		}
		const id = this.routeEventId();
		if (!id) {
			return undefined;
		}
		// Read the events signal so this re-resolves once program data finishes loading
		// (e.g. cold start from a notification tap, before #allEvents is populated).
		this.programService.events();
		return this.programService.getEvent(id);
	});

	protected readonly place: Signal<IProgramPlace | undefined> = computed(() => {
		if (this.dialogData) {
			return this.dialogData.place;
		}
		const event = this.event();
		return event ? this.programService.getPlaceById(event.locationId) : undefined;
	});

	// Routed mode only: still waiting for program data, so don't show "not found" yet.
	protected readonly loading: Signal<boolean> = computed(
		() => !this.dialogData && !this.event() && this.programService.eventsLoading()
	);

	protected close(): void {
		if (this.dialogRef) {
			this.dialogRef.close();
		} else {
			void this.router.navigate(['/', ERoute.PROGRAM]);
		}
	}

	protected toggleFavorite(): void {
		const event = this.event();
		if (!event) {
			return;
		}
		event.favorite = !event.favorite;
		this.programService.updateEvent(event, 'favorite', event.favorite);
	}
}
