import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ERoute} from '../../../../common/types/ERoute';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-bottom-menu',
	templateUrl: './bottom-menu.component.html',
	styleUrls: ['./bottom-menu.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatToolbarModule,
		FormsModule,
		RouterModule
	]
})
export class BottomMenuComponent {
	protected readonly ERoute = ERoute;
	private readonly translate: TranslateService = inject(TranslateService);

	protected openFAQ(): void {
		if(this.translate.currentLang === 'cs') {
			window.open('https://docs.google.com/document/d/1StVQlwSWorjiQyfoLuckcz8geOw3uurjPaC8ni5jwbQ/edit?usp=sharing', '_blank');
		} else {
			window.open('https://docs.google.com/document/d/1UGDLkfL1gM7RnHSdhyqBucoIrqRw9k5MxgfKodPGEAE/edit?usp=sharing', '_blank');
		}
	}
}
