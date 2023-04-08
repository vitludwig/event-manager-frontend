import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailPreviewComponent } from './event-detail-preview.component';

describe('EventDetailPreviewComponent', () => {
  let component: EventDetailPreviewComponent;
  let fixture: ComponentFixture<EventDetailPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ EventDetailPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDetailPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
