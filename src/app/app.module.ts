import { NgModule, inject, isDevMode, provideAppInitializer } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {provideServiceWorker} from '@angular/service-worker';
import {Capacitor} from '@capacitor/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BottomMenuComponent} from './modules/layout/components/bottom-menu/bottom-menu.component';
import {HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {appInitializerFactory} from './app-initializer.factory';
import {
    TranslateModule,
    TranslateLoader,
    MissingTranslationHandlerParams,
    MissingTranslationHandler
} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {InitService} from "./common/services/init/init.service";

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
    /**
     * in case of missing translation, use string given in template pipe
     * @param params
     */
    handle(params: MissingTranslationHandlerParams): string {
        return params.key;
    }
}

@NgModule({
    declarations: [
        AppComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule,
        MatSnackBarModule,
        BottomMenuComponent,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            missingTranslationHandler: {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
        }),
    ],
    providers: [
        provideAppInitializer(() => {
        const initializerFn = (appInitializerFactory)(inject(InitService));
        return initializerFn();
      }),
        provideHttpClient(withInterceptorsFromDi()),
        // Web only. On native (Capacitor) the app is served from a bundled local origin and updates
        // with the native binary — a service worker there would cache the shell and fight Capacitor's
        // file serving. Disabled in dev too, where ngsw-worker.js isn't emitted. This is what fixes
        // stale-app-version loads on the web (see PwaUpdateService for the reload-on-new-version).
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode() && !Capacitor.isNativePlatform(),
            registrationStrategy: 'registerWhenStable:30000',
        }),
    ]
})
export class AppModule {
}
