import {inject, Injectable} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {EDisplayDevice} from "../../types/EDisplayDevice";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private route: ActivatedRoute = inject(ActivatedRoute);

  public device: EDisplayDevice = EDisplayDevice.BASIC;

  public determineDisplayDevice() {
    // TODO: rewite to signals
    this.route.queryParams.subscribe((param) => {
      this.device = param['display'] ?? EDisplayDevice.BASIC;
    })
  }
}
