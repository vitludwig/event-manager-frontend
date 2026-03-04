import { test, expect, Page } from '@playwright/test';

// Wide landscape SVG (1200x800) simulating a festival map
// Left edge blue, center green, right edge red - for visual debugging
const TEST_MAP_SVG = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">',
    '<rect width="1200" height="800" fill="#4CAF50"/>',
    '<rect width="100" height="800" fill="#2196F3"/>',
    '<rect x="1100" width="100" height="800" fill="#F44336"/>',
    '</svg>',
].join('');

const TEST_MAP_DATA_URI =
    'data:image/svg+xml;base64,' + Buffer.from(TEST_MAP_SVG).toString('base64');

/**
 * Perform a touch drag gesture using CDP (Chrome DevTools Protocol).
 * pinch-zoom library responds to touch events, not mouse drag.
 */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 10) {
    const client = await page.context().newCDPSession(page);

    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: Math.round(from.x), y: Math.round(from.y) }],
    });

    for (let i = 1; i <= steps; i++) {
        const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
        const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y }],
        });
    }

    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
    });

    await client.detach();
}

/**
 * Zoom in at the center of the given element using mouse wheel.
 */
async function zoomIn(page: Page, element: { x: number; y: number; width: number; height: number }) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    await page.mouse.move(cx, cy);
    for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
}

test.describe('Map Module - Zoom and Pan', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(/.*appEventId\.txt/, route =>
            route.fulfill({ status: 200, contentType: 'text/plain', body: 'test-event-id' }),
        );

        await page.route(/.*\/api\/v1\/maps/, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ name: 'map1', value: TEST_MAP_DATA_URI }]),
            }),
        );

        // Return 404 for competitions/tribes so only the main map tab shows
        await page.route(/.*\/public\/competitions-info\.json/, route =>
            route.fulfill({ status: 404 }),
        );
        await page.route(/.*\/public\/tribe-info\.json/, route =>
            route.fulfill({ status: 404 }),
        );

        await page.route(/.*\/signalr/, route => route.abort());

        await page.addInitScript(() => {
            localStorage.setItem('language', 'en');
            localStorage.setItem('appEventId', 'test-event-id');
        });

        await page.goto('/map');
    });

    test('should display the festival map inside pinch-zoom', async ({ page }) => {
        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const img = pinchZoom.locator('img');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('alt', 'Festival map');
    });

    test('img-wrapper must not have touch-action or overflow that blocks pinch-zoom', async ({ page }) => {
        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const imgWrapper = pinchZoom.locator('.img-wrapper');

        // touch-action: pan-x pan-y was the root cause — it stole touch events
        // from the pinch-zoom library, preventing panning after zoom.
        const touchAction = await imgWrapper.evaluate(el =>
            window.getComputedStyle(el).touchAction,
        );
        expect(touchAction).toBe('auto');

        // overflow: auto created a native scroll context competing with pinch-zoom
        const overflow = await imgWrapper.evaluate(el =>
            window.getComputedStyle(el).overflow,
        );
        expect(overflow).not.toBe('auto');
    });

    test('should zoom in with mouse wheel', async ({ page }) => {
        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const img = pinchZoom.locator('img');
        await expect(img).toBeVisible();

        const initialBox = (await img.boundingBox())!;
        const containerBox = (await pinchZoom.boundingBox())!;

        await zoomIn(page, containerBox);

        const zoomedBox = (await img.boundingBox())!;
        expect(zoomedBox.width).toBeGreaterThan(initialBox.width * 1.2);
    });

    test('should pan the zoomed map when dragging', async ({ page }) => {
        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const img = pinchZoom.locator('img');
        await expect(img).toBeVisible();

        const containerBox = (await pinchZoom.boundingBox())!;
        const cx = containerBox.x + containerBox.width / 2;
        const cy = containerBox.y + containerBox.height / 2;

        // Zoom in
        await zoomIn(page, containerBox);
        const afterZoomBox = (await img.boundingBox())!;

        // Pan right (drag content left)
        await touchDrag(page, { x: cx, y: cy }, { x: cx - containerBox.width * 0.5, y: cy });
        await page.waitForTimeout(300);

        const afterPanBox = (await img.boundingBox())!;

        // Image must have moved left (its x decreased)
        expect(afterPanBox.x).toBeLessThan(afterZoomBox.x - 20);
    });

    // The original bug: on mobile, touch-action CSS stole events from pinch-zoom,
    // making it impossible to pan to the right edge of the map after zooming in.
    test('should reach the right edge of the map after zooming and panning @mobile', async ({ page }) => {

        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const img = pinchZoom.locator('img');
        await expect(img).toBeVisible();

        const containerBox = (await pinchZoom.boundingBox())!;
        const cx = containerBox.x + containerBox.width / 2;
        const cy = containerBox.y + containerBox.height / 2;

        await zoomIn(page, containerBox);

        // Pan right: multiple touch drags to reach the edge
        for (let pass = 0; pass < 5; pass++) {
            await touchDrag(page, { x: cx, y: cy }, { x: cx - containerBox.width * 0.7, y: cy });
            await page.waitForTimeout(200);
        }

        const pannedImgBox = (await img.boundingBox())!;
        const pannedRightEdge = pannedImgBox.x + pannedImgBox.width;
        const containerRightEdge = containerBox.x + containerBox.width;

        // Right edge of the image should be approximately at the container's right edge
        expect(pannedRightEdge).toBeGreaterThanOrEqual(containerRightEdge - 50);
        expect(pannedRightEdge).toBeLessThanOrEqual(containerRightEdge + 50);
    });

    test('should reach the left edge of the map after zooming and panning @mobile', async ({ page }) => {

        const pinchZoom = page.locator('pinch-zoom').first();
        await expect(pinchZoom).toBeVisible();

        const img = pinchZoom.locator('img');
        await expect(img).toBeVisible();

        const containerBox = (await pinchZoom.boundingBox())!;
        const cx = containerBox.x + containerBox.width / 2;
        const cy = containerBox.y + containerBox.height / 2;

        await zoomIn(page, containerBox);

        // Pan left: multiple touch drags to reach the edge
        for (let pass = 0; pass < 5; pass++) {
            await touchDrag(page, { x: cx, y: cy }, { x: cx + containerBox.width * 0.7, y: cy });
            await page.waitForTimeout(200);
        }

        const pannedImgBox = (await img.boundingBox())!;
        const containerLeftEdge = containerBox.x;

        // Left edge of the image should be approximately at the container's left edge
        expect(pannedImgBox.x).toBeGreaterThanOrEqual(containerLeftEdge - 50);
        expect(pannedImgBox.x).toBeLessThanOrEqual(containerLeftEdge + 50);
    });
});
