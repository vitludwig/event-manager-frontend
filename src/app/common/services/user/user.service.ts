import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {IUserInfo} from '../../components/user-info/types/IUserInfo';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	public token: string | undefined;
	public userId: number | undefined;

	private readonly http: HttpClient = inject(HttpClient);

	public getUserInfo(userId: number, token: string): Promise<IUserInfo> {
		return firstValueFrom(this.http.get<IUserInfo>(`http://cybertown-kredsys.eu:8888/userInfo/${userId}/${token}`));
	}
}
