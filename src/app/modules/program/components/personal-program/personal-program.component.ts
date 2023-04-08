import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProgramService} from '../../services/program/program.service';

@Component({
	selector: 'app-personal-program',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './personal-program.component.html',
	styleUrls: ['./personal-program.component.scss']
})
export class PersonalProgramComponent {

	constructor(protected programService: ProgramService) {
	}
}
