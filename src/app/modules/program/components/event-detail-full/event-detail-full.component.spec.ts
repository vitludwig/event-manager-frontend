import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailFullComponent } from './event-detail-full.component';

describe('EventDetailFullComponent', () => {
  let component: EventDetailFullComponent;
  let fixture: ComponentFixture<EventDetailFullComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ EventDetailFullComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDetailFullComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
