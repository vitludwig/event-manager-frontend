import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {IUserInfo} from '../../components/user-info/types/IUserInfo';

@Injectable({
	providedIn: 'root'
})
export class UserService {

	public get token(): string | undefined {
		return this.#token ?? localStorage.getItem('token') ?? undefined;
	}

	public set token(value: string | undefined) {
		this.#token = value;
		if(value) {
			localStorage.setItem('token', value);
		}
	}

	public get userId(): number | undefined {
		return this.#userId ?? (localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : undefined);
	}

	public set userId(value: number | undefined) {
		this.#userId = value;
		if(value) {
			localStorage.setItem('userId', JSON.stringify(value));
		}
	}

	public get lastChecked(): string {
		return this.#lastChecked ?? localStorage.getItem('lastChecked') ?? new Date().toString();
	}

	public set lastChecked(value: string) {
		this.#lastChecked = value;

		if(value) {
			localStorage.setItem('lastChecked', JSON.stringify(value));
		}
	}

	private readonly http: HttpClient = inject(HttpClient);

	#token: string | undefined;
	#userId: number | undefined;
	#lastChecked: string;

	public getUserInfo(userId: number, token: string): Promise<IUserInfo> {
		return firstValueFrom(this.http.get<IUserInfo>(`https://cybertown-kredsys.eu/kredsys-api/userInfo/${userId}/${token}`));
	}
}
