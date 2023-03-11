import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalEventComponent } from './horizontal-event.component';

describe('HorizontalEventComponent', () => {
  let component: HorizontalEventComponent;
  let fixture: ComponentFixture<HorizontalEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ HorizontalEventComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorizontalEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
