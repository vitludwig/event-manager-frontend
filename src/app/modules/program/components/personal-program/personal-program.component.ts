import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProgramService} from '../../services/program/program.service';
import {ProgramVerticalListComponent} from '../program-vertical-list/program-vertical-list.component';
import {Observable} from 'rxjs';
import {IEvent} from '../../types/IEvent';

@Component({
	selector: 'app-personal-program',
	standalone: true,
	imports: [CommonModule, ProgramVerticalListComponent],
	templateUrl: './personal-program.component.html',
	styleUrls: ['./personal-program.component.scss']
})
export class PersonalProgramComponent {
	protected events: Observable<IEvent[]>;

	constructor(protected programService: ProgramService) {
		this.events = this.programService.getEvents();
	}
}
