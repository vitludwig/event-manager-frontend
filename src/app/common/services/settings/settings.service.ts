import {inject, Injectable} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {toSignal} from "@angular/core/rxjs-interop";
import {map} from "rxjs";
import {EDisplayDevice} from "../../types/EDisplayDevice";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public readonly device = toSignal(
    this.route.queryParams.pipe(map(p => p['display'] ?? EDisplayDevice.BASIC)),
    {initialValue: EDisplayDevice.BASIC}
  );
}
