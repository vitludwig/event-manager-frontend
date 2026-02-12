import { Injectable, inject, DOCUMENT } from '@angular/core';

import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {environment} from "../../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private document = inject(DOCUMENT);
    private http = inject(HttpClient);

    // Keep track of the current theme link element so we can remove/update it
    private currentThemeLink: HTMLLinkElement | null = null;

    async loadThemeBundle(): Promise<void> {
        const head = this.document.getElementsByTagName('head')[0];
        let activeTheme;
        try {
            activeTheme = await firstValueFrom(this.http.get(`${environment.signalrUrl}/public/themes/active-theme.txt`, {responseType: 'text'}));
        } catch(e) {
            activeTheme = 'rzb-theme';
        }

        if(!activeTheme) {
            activeTheme = 'rzb-theme';
        }

        if (this.currentThemeLink) {
            this.currentThemeLink.href = `${environment.signalrUrl}/public/themes/${activeTheme}.css`;
        } else {
            const style = this.document.createElement('link');
            style.id = 'client-theme';
            style.rel = 'stylesheet';
            style.href = `${environment.signalrUrl}/public/themes/${activeTheme}.css`;
            style.onerror = () => {
                style.onerror = null;
                style.href = '/assets/themes/rzb-theme.css';
            }

            head.appendChild(style);
            this.currentThemeLink = style;
        }
    }
}