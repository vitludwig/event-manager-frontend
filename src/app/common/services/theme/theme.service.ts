import { Injectable, inject, DOCUMENT } from '@angular/core';
import { CustomizationService } from '../customization/customization.service';

const DEFAULT_THEME_URL = '/assets/themes/rzb-theme.css';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private document = inject(DOCUMENT);
    private customizationService = inject(CustomizationService);

    async loadThemeBundle(): Promise<void> {
        let themeCssUrl = this.customizationService.themeCssUrl;
        if (!themeCssUrl) {
            themeCssUrl = DEFAULT_THEME_URL;
        }

        const head = this.document.getElementsByTagName('head')[0];
        const style = this.document.createElement('link');
        style.id = 'client-theme';
        style.rel = 'stylesheet';
        style.href = themeCssUrl;
        style.onerror = () => {
            style.onerror = null;
            style.href = DEFAULT_THEME_URL;
        }

        head.appendChild(style);
    }
}
