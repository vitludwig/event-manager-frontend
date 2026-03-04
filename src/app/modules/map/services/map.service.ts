import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface IMapImage {
    name: string;
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private readonly http = inject(HttpClient);

    private readonly maps$ = this.http.get<IMapImage[]>(`${environment.apiUrl}/maps`).pipe(
        shareReplay(1)
    );

    public getMaps(): Observable<IMapImage[]> {
        return this.maps$;
    }
}
