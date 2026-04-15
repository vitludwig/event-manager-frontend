import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {FullProgramComponent} from './components/full-program/full-program.component';
import {ProgramService} from './services/program/program.service';

@Component({
    selector: 'app-program',
    imports: [
    MatTabsModule,
    MatProgressSpinnerModule,
    FullProgramComponent
],
    templateUrl: './program.component.html',
    styleUrls: ['./program.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramComponent {
    protected readonly programService = inject(ProgramService);
}
