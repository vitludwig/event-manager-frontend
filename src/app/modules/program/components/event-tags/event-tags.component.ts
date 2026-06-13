import {Component, inject, input} from '@angular/core';
import {IEvent} from "../../types/IEvent";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatIcon} from "@angular/material/icon";
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: 'app-event-tags',
    imports: [
        MatChipSet,
        MatChip,
        MatIcon
    ],
    templateUrl: './event-tags.component.html',
    styleUrl: './event-tags.component.scss'
})
export class EventTagsComponent {
  protected readonly translate: TranslateService = inject(TranslateService);

  public event = input.required<IEvent>();
}
