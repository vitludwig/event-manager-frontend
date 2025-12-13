import {Component} from '@angular/core';

import {MatTabsModule} from '@angular/material/tabs';
import {FullProgramComponent} from './components/full-program/full-program.component';

@Component({
    selector: 'app-program',
    imports: [
    MatTabsModule,
    FullProgramComponent
],
    templateUrl: './program.component.html',
    styleUrls: ['./program.component.scss']
})
export class ProgramComponent {

}
