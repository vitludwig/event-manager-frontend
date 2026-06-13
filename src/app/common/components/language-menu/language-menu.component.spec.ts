import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {LanguageMenuComponent} from './language-menu.component';

describe('LanguageMenuComponent', () => {
	let component: LanguageMenuComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [LanguageMenuComponent, TranslateModule.forRoot()],
		});
		const fixture = TestBed.createComponent(LanguageMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
