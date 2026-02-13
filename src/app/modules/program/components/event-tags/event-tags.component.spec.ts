import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {EventTagsComponent} from './event-tags.component';

describe('EventTagsComponent', () => {
	let component: EventTagsComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [EventTagsComponent, TranslateModule.forRoot()],
		});

		const fixture = TestBed.createComponent(EventTagsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('event', {
			id: 'e1', name: 'Test', name_EN: 'Test EN',
			tags: [{id: 't1', name: 'Rock', name_EN: 'Rock'}],
		});
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
