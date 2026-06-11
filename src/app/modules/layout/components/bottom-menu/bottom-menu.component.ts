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
import {CustomizationService} from "../../../../common/services/customization/customization.service";

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
	private readonly customizationService = inject(CustomizationService);

	protected EDisplayDevice = EDisplayDevice;

	protected get configurableButtonUrl(): string | undefined {
		const isCs = this.translate.currentLang === 'cs';
		const primary = isCs ? this.customizationService.faqUrlCs : this.customizationService.faqUrlEn;
		const fallback = isCs ? this.customizationService.faqUrlEn : this.customizationService.faqUrlCs;
		// Fall back to the other language's URL so a single-language config still shows the button.
		return primary ?? fallback;
	}

	protected get configurableButtonIcon(): string {
		return this.customizationService.configurableButtonIcon || 'help';
	}

	protected get showConfigurableButton(): boolean {
		return !!this.configurableButtonUrl;
	}

	protected openConfigurableButton(): void {
		const url = this.configurableButtonUrl;
		if (url) {
			// noopener,noreferrer prevents the opened (operator-supplied) page from
			// hijacking this tab via window.opener (tabnabbing).
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	}
}
