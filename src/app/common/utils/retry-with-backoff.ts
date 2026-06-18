import { MonoTypeOperatorFunction, Observable, retry, timer } from 'rxjs';

/**
 * Retry a (cold) HTTP observable with exponential backoff. Intended for flaky
 * mobile connections where a single timeout/blip shouldn't surface as a failure.
 *
 * Delays: baseMs, 2*baseMs, 4*baseMs ... capped at maxMs. Only retries on error;
 * a successful response passes straight through with no added latency.
 */
export function retryWithBackoff<T>(count = 3, baseMs = 1000, maxMs = 8000): MonoTypeOperatorFunction<T> {
	return (source: Observable<T>) =>
		source.pipe(
			retry({
				count,
				delay: (_error, retryIndex) => timer(Math.min(baseMs * 2 ** (retryIndex - 1), maxMs)),
			})
		);
}
