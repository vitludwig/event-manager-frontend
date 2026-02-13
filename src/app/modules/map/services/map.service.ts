import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface IMapImage {
    name: string;
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private readonly http = inject(HttpClient);

    public getMaps(): Observable<IMapImage[]> {
        return this.http.get<IMapImage[]>(`${environment.apiUrl}/maps`);
    }
}
