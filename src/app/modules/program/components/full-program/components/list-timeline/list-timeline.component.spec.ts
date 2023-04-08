import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTimelineComponent } from './list-timeline.component';

describe('ListTimelineComponent', () => {
  let component: ListTimelineComponent;
  let fixture: ComponentFixture<ListTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ListTimelineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
