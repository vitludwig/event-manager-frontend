import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-language-menu',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
	templateUrl: './language-menu.component.html',
	styleUrls: ['./language-menu.component.scss'],
})
export class LanguageMenuComponent {
	protected translate: TranslateService = inject(TranslateService);

	protected setLanguage(language: 'cs' | 'en'): void {
		this.translate.use(language);
		localStorage.setItem('language', language);

		window.location.reload();
	}
}
