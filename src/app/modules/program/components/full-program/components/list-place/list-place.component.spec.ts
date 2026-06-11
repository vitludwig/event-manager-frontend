import { ComponentFixture, TestBed } from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import { ListPlaceComponent } from './list-place.component';

describe('ListPlaceComponent', () => {
  let component: ListPlaceComponent;
  let fixture: ComponentFixture<ListPlaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ListPlaceComponent, TranslateModule.forRoot() ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPlaceComponent);
    component = fixture.componentInstance;
    component.place = {id: 'p1', name: 'Place 1'};
    component.segments = [];
    component.layout = {eventsByStartSegment: {}, laneCount: 1, hasOverlap: false};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes 65px row height for a single lane', () => {
    expect((component as any).rowHeight()).toBe(65);
  });

  it('grows the row height for multiple lanes', () => {
    component.layout = {eventsByStartSegment: {}, laneCount: 2, hasOverlap: true};
    expect((component as any).rowHeight()).toBe(134);
  });
});
