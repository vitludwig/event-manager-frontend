export interface ILocalizedName {
	name: string;
	nameEn?: string | null;
}

/**
 * Per-language display name: English uses nameEn when present, otherwise the
 * Czech `name` is used (both for Czech and as the English fallback).
 */
export function localizedName(obj: ILocalizedName, lang: string | undefined): string {
	return lang === 'en' && obj.nameEn ? obj.nameEn : obj.name;
}
