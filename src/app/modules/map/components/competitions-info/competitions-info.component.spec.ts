import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionsInfoComponent } from './competitions-info.component';

describe('OpeningHoursComponent', () => {
  let component: CompetitionsInfoComponent;
  let fixture: ComponentFixture<CompetitionsInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompetitionsInfoComponent]
    });
    fixture = TestBed.createComponent(CompetitionsInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
