import {Component, computed, inject, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatRippleModule} from '@angular/material/core';
import {NotificationService} from './services/notification/notification.service';
import {ProgramService} from '../program/services/program/program.service';
import {IEvent} from '../program/types/IEvent';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatDialogModule} from '@angular/material/dialog';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-notifications',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatRippleModule,
        MatToolbarModule,
        MatDialogModule,
        TranslateModule
    ],
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
    protected readonly eventsById = computed(() => {
        const events = this.programService.events();
        const result: Record<string, IEvent | null> = {};
        for (const event of events) {
            result[event.id] = event;
        }
        return result;
    });

    protected readonly notificationService: NotificationService = inject(NotificationService);
    protected readonly translate: TranslateService = inject(TranslateService);
    private readonly programService: ProgramService = inject(ProgramService);

    public ngOnInit(): void {
        this.notificationService.loadNotifications();
    }
}
