import { DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { CustomizationService } from '../customization/customization.service';

/**
 * Applies the customizable page identity — page title, favicon, and (best-effort) the installable
 * PWA name/icons — from the customization payload, reactively (stale-while-revalidate: re-applies
 * whenever customization refreshes from the network).
 *
 * Fallback rule: whatever is present in the document at startup is the default. If the customization
 * omits a value, gives an empty string, or the favicon image fails to load, we restore that default.
 * So removing a value in the admin cleanly reverts to the built-in identity.
 */
@Injectable({ providedIn: 'root' })
export class AppIdentityService {
	private readonly document = inject(DOCUMENT);
	private readonly customization = inject(CustomizationService);

	/** Captured before we ever mutate them, so they are the genuine "what's there now" defaults. */
	private readonly defaultTitle: string;
	private readonly defaultFaviconHref: string;
	private readonly defaultFaviconType: string | null;
	private readonly defaultManifestHref: string | null;

	private baseManifest: Record<string, unknown> | null = null;
	private baseManifestFetch: Promise<Record<string, unknown> | null> | null = null;
	private customManifestUrl: string | null = null;
	/** Guards against a slow favicon probe from an earlier value overwriting a newer one. */
	private faviconRequestId = 0;
	/** Same guard for the async manifest build, so an older customization can't win a late race. */
	private manifestRequestId = 0;

	constructor() {
		this.defaultTitle = this.document.title;
		const faviconLink = this.getFaviconLink();
		this.defaultFaviconHref = faviconLink.href;
		this.defaultFaviconType = faviconLink.getAttribute('type');
		this.defaultManifestHref = this.getManifestLink()?.getAttribute('href') ?? null;

		// Reads the appName/faviconUrl getters (which read the customization signal) so this re-runs
		// on every customization update. Kept resilient: a failing manifest swap must not break the
		// reliable title/favicon updates.
		effect(() => {
			const appName = this.customization.appName;
			const faviconUrl = this.customization.faviconUrl;

			this.applyTitle(appName);
			this.applyFavicon(faviconUrl);
			void this.applyManifest(appName, faviconUrl);
		});
	}

	private applyTitle(appName: string | undefined): void {
		const title = appName?.trim() ? appName.trim() : this.defaultTitle;
		if (this.document.title !== title) {
			this.document.title = title;
		}
		// Home-screen label for legacy iOS "Add to Home Screen" (manifest is ignored there).
		this.setMetaContent('apple-mobile-web-app-title', title);
	}

	private applyFavicon(faviconUrl: string | undefined): void {
		const link = this.getFaviconLink();
		const requestId = ++this.faviconRequestId;

		if (!faviconUrl) {
			this.setFavicon(link, this.defaultFaviconHref, this.defaultFaviconType);
			return;
		}

		// Validate that the URL actually loads before swapping — an unreachable/broken path must fall
		// back to the default rather than leave a blank icon. Image loading is not CORS-restricted.
		const probe = new Image();
		probe.onload = () => {
			if (requestId === this.faviconRequestId) {
				this.setFavicon(link, faviconUrl, this.guessImageType(faviconUrl));
			}
		};
		probe.onerror = () => {
			if (requestId === this.faviconRequestId) {
				this.setFavicon(link, this.defaultFaviconHref, this.defaultFaviconType);
			}
		};
		probe.src = faviconUrl;
	}

	/**
	 * Best-effort installable-PWA identity: swap the manifest <link> for a blob built from the static
	 * manifest with name/short_name and icons overridden. Browser support for re-reading a swapped
	 * manifest varies, hence best-effort. Absolute URLs are required inside a blob: manifest.
	 */
	private async applyManifest(appName: string | undefined, faviconUrl: string | undefined): Promise<void> {
		const requestId = ++this.manifestRequestId;
		try {
			const link = this.getManifestLink();
			if (!link) {
				return;
			}

			const name = appName?.trim();
			// Nothing custom → restore the original static manifest and drop any blob we made.
			if (!name && !faviconUrl) {
				if (this.defaultManifestHref) {
					link.setAttribute('href', this.defaultManifestHref);
				}
				this.releaseCustomManifest();
				return;
			}

			const base = await this.loadBaseManifest();
			// Bail if a newer customization update started after us — its manifest must win.
			if (!base || requestId !== this.manifestRequestId) {
				return;
			}

			const manifest: Record<string, unknown> = { ...base };
			if (name) {
				manifest['name'] = name;
				manifest['short_name'] = name;
			}
			// Blob manifests can't resolve relative URLs — make everything absolute against the app origin.
			manifest['start_url'] = this.toAbsolute((base['start_url'] as string) ?? '/');
			manifest['scope'] = this.toAbsolute((base['scope'] as string) ?? '/');

			// Keep the base 192/512 icon set so the app stays installable (Chrome needs concrete large
			// sizes). Only an SVG favicon is scalable enough to serve as an install icon, so prepend it
			// alongside the base set; a single raster favicon (or .ico, which manifests don't accept)
			// would otherwise regress installability. No `maskable` — an arbitrary favicon has no safe
			// zone and would get its edges cropped.
			const baseIcons = Array.isArray(base['icons']) ? (base['icons'] as Array<Record<string, unknown>>) : [];
			const absoluteBaseIcons = baseIcons.map((icon) => ({ ...icon, src: this.toAbsolute(String(icon['src'] ?? '')) }));
			if (faviconUrl && this.guessImageType(faviconUrl) === 'image/svg+xml') {
				manifest['icons'] = [{ src: faviconUrl, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }, ...absoluteBaseIcons];
			} else {
				manifest['icons'] = absoluteBaseIcons;
			}

			const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			this.releaseCustomManifest();
			this.customManifestUrl = url;
		} catch (e) {
			console.error('Failed to apply custom PWA manifest: ', e);
		}
	}

	private async loadBaseManifest(): Promise<Record<string, unknown> | null> {
		if (this.baseManifest) {
			return this.baseManifest;
		}
		if (!this.baseManifestFetch) {
			const href = this.defaultManifestHref ?? 'manifest.webmanifest';
			this.baseManifestFetch = fetch(href)
				.then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
				.then((json) => {
					this.baseManifest = json;
					return json;
				})
				.catch(() => null);
		}
		return this.baseManifestFetch;
	}

	private releaseCustomManifest(): void {
		if (this.customManifestUrl) {
			URL.revokeObjectURL(this.customManifestUrl);
			this.customManifestUrl = null;
		}
	}

	private setFavicon(link: HTMLLinkElement, href: string, type: string | null): void {
		if (link.href !== href) {
			link.href = href;
		}
		// Keep the advisory `type` in sync with the actual bytes — a stale type="image/x-icon" on a
		// PNG/SVG makes some browsers (Safari/older engines) skip the icon and keep showing the old one.
		if (type) {
			link.type = type;
		} else {
			link.removeAttribute('type');
		}
	}

	private getFaviconLink(): HTMLLinkElement {
		let link = this.document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
		if (!link) {
			link = this.document.createElement('link');
			link.rel = 'icon';
			this.document.head.appendChild(link);
		}
		return link;
	}

	private getManifestLink(): HTMLLinkElement | null {
		return this.document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
	}

	private setMetaContent(name: string, content: string): void {
		let meta = this.document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
		if (!meta) {
			meta = this.document.createElement('meta');
			meta.name = name;
			this.document.head.appendChild(meta);
		}
		meta.content = content;
	}

	private toAbsolute(path: string): string {
		try {
			return new URL(path, this.document.baseURI).href;
		} catch {
			return path;
		}
	}

	private guessImageType(url: string): string {
		const clean = url.split('?')[0].toLowerCase();
		if (clean.endsWith('.png')) return 'image/png';
		if (clean.endsWith('.svg')) return 'image/svg+xml';
		if (clean.endsWith('.webp')) return 'image/webp';
		if (clean.endsWith('.ico')) return 'image/x-icon';
		if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
		if (clean.endsWith('.gif')) return 'image/gif';
		return 'image/png';
	}
}
