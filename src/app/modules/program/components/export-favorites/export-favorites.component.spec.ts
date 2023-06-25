import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportFavoritesComponent } from './export-favorites.component';

describe('ExportFavoritesComponent', () => {
  let component: ExportFavoritesComponent;
  let fixture: ComponentFixture<ExportFavoritesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExportFavoritesComponent]
    });
    fixture = TestBed.createComponent(ExportFavoritesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
