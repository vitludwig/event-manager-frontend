import { Injectable, inject, DOCUMENT } from '@angular/core';

import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {environment} from "../../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private document = inject(DOCUMENT);
    private http = inject(HttpClient);

    async loadThemeBundle(): Promise<void> {
        const head = this.document.getElementsByTagName('head')[0];
        let activeTheme;
        let activeThemeVersion;
        try {
            activeTheme = await firstValueFrom(this.http.get(`${environment.signalrUrl}/public/themes/active-theme.txt`, {responseType: 'text'}));
            activeThemeVersion = await firstValueFrom(this.http.get(`${environment.signalrUrl}/public/themes/active-theme-version.txt`, {responseType: 'text'}));
        } catch(e) {
            activeTheme = 'rzb-theme';
        }

        if(!activeTheme) {
            activeTheme = 'rzb-theme';
        }
        const style = this.document.createElement('link');
        style.id = 'client-theme';
        style.rel = 'stylesheet';
        style.href = `${environment.signalrUrl}/public/themes/${activeTheme}.css?v=${activeThemeVersion}`;
        style.onerror = () => {
            style.onerror = null;
            style.href = '/assets/themes/rzb-theme.css';
        }

        head.appendChild(style);

    }
}