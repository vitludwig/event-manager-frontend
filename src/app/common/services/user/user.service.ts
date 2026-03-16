import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {IUserInfo} from '../../components/user-info/types/IUserInfo';
import {CustomizationService} from '../customization/customization.service';

const DEFAULT_WALLET_API_URL = 'https://cybertown-kredsys.eu/kredsys-api/userInfo';

@Injectable({
	providedIn: 'root'
})
export class UserService {

	public get walletToken(): string | undefined {
		return this.#token ?? localStorage.getItem('token') ?? undefined;
	}

	public set walletToken(value: string | undefined) {
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
	private readonly customizationService: CustomizationService = inject(CustomizationService);

	#token: string | undefined;
	#userId: number | undefined;
	#lastChecked: string;

	public getUserInfo(userId: number, token: string): Promise<IUserInfo> {
		const baseUrl = this.customizationService.walletApiUrl ?? DEFAULT_WALLET_API_URL;
		return firstValueFrom(this.http.get<IUserInfo>(`${baseUrl}/${userId}/${token}`));
	}
}
