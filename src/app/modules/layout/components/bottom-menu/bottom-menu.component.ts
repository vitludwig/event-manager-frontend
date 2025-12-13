import {Component, inject} from '@angular/core';

import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ERoute} from '../../../../common/types/ERoute';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {SettingsService} from "../../../../common/services/settings/settings.service";
import {EDisplayDevice} from "../../../../common/types/EDisplayDevice";
import {environment} from "../../../../../environments/environment";
import {EFestivalID} from "../../../../common/types/EFestivalID";

@Component({
    selector: 'app-bottom-menu',
    templateUrl: './bottom-menu.component.html',
    styleUrls: ['./bottom-menu.component.scss'],
    imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    FormsModule,
    RouterModule,
    TranslateModule
]
})
export class BottomMenuComponent {
	protected readonly ERoute = ERoute;
	protected readonly settingsService: SettingsService = inject(SettingsService);
	private readonly translate: TranslateService = inject(TranslateService);

	protected EDisplayDevice = EDisplayDevice;

	protected openFAQ(): void {
		if(this.translate.currentLang === 'cs') {
			window.open(environment.faqUrl_CS, '_blank');
		} else {
			window.open(environment.faqUrl_EN, '_blank');
		}
	}

	protected readonly environment = environment;
	protected readonly EFestivalID = EFestivalID;
}
