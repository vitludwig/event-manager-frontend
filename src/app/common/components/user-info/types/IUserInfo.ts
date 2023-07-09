export interface IUserInfo {
	user: IUserInfoUser;
	transactions: IUserInfoTransaction[];
}

export interface IUserInfoUser {
	Name: string;
	MemberId: string;
	Email: string;
	DepositSum: string;
	BuySum: string;
	WithdrawSum: string;
	TotalSum: string;
}

export interface IUserInfoTransaction {
	Id: number;
	Created: string;
	Name: string;
	AmountSum: string;
}
