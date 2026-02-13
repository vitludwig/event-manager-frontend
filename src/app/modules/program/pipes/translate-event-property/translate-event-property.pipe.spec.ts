import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {TranslateEventPropertyPipe} from './translate-event-property.pipe';

describe('TranslateEventPipe', () => {
	let pipe: TranslateEventPropertyPipe;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslateModule.forRoot()],
			providers: [TranslateEventPropertyPipe],
		});
		pipe = TestBed.inject(TranslateEventPropertyPipe);
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});
});
