export class Utils {

	public static replaceCzechAccentSymbols(text: string): string {
		return text
			.replace(/á/g, 'a')
			.replace(/č/g, 'c')
			.replace(/ď/g, 'd')
			.replace(/é/g, 'e')
			.replace(/ě/g, 'e')
			.replace(/í/g, 'i')
			.replace(/ň/g, 'n')
			.replace(/ó/g, 'o')
			.replace(/ř/g, 'r')
			.replace(/š/g, 's')
			.replace(/ť/g, 't')
			.replace(/ú/g, 'u')
			.replace(/ů/g, 'u')
			.replace(/ý/g, 'y')
			.replace(/ž/g, 'z');
	}
}
