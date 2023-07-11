export interface IUserInfo {
	user: IUserInfoUser;
	transactions: IUserInfoTransaction[];
}

export interface IUserInfoUser {
	Name: string;
	MemberId: string;
	Email: string;
	DepositSum: number | null;
	BuySum: number | null;
	WithdrawSum: number | null;
	TotalSum: number;
}

export interface IUserInfoTransaction {
	Id: number;
	Created: string;
	Name: string;
	AmountSum: string;
}
