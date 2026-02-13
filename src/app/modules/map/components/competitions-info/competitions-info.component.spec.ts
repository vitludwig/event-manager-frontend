import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {CompetitionsInfoComponent} from './competitions-info.component';
import {ComponentRef} from '@angular/core';

describe('CompetitionsInfoComponent', () => {
	let component: CompetitionsInfoComponent;
	let componentRef: ComponentRef<CompetitionsInfoComponent>;
	let fixture: ComponentFixture<CompetitionsInfoComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [CompetitionsInfoComponent, TranslateModule.forRoot()]
		});
		fixture = TestBed.createComponent(CompetitionsInfoComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('data', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
