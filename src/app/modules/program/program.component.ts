import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {FullProgramComponent} from './components/full-program/full-program.component';

@Component({
	selector: 'app-program',
	standalone: true,
	imports: [
		CommonModule,
		MatTabsModule,
		FullProgramComponent,
	],
	templateUrl: './program.component.html',
	styleUrls: ['./program.component.scss']
})
export class ProgramComponent {

}
