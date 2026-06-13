import { TestBed } from '@angular/core/testing';

import { PermissionsService } from './permissions.service';

describe('PermissionService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
