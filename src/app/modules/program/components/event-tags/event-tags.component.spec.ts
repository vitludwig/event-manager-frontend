import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTagsComponent } from './event-tags.component';

describe('EventTagsComponent', () => {
  let component: EventTagsComponent;
  let fixture: ComponentFixture<EventTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
