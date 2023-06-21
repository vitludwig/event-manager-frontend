import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsSettingsComponent } from './notifications-settings.component';

describe('NotificationsSettingsComponent', () => {
  let component: NotificationsSettingsComponent;
  let fixture: ComponentFixture<NotificationsSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationsSettingsComponent]
    });
    fixture = TestBed.createComponent(NotificationsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
