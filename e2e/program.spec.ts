import { test, expect } from '@playwright/test';
import events from './data/events.json';
import places from './data/places.json';
import eventTypes from './data/eventTypes.json';
import tags from './data/tags.json';

test.describe('Program Module', () => {
    test.beforeEach(async ({ page }) => {
        // Enable console logging from the browser
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        // Mock the appEventId endpoint to match localStorage
        await page.route(/.*appEventId\.txt/, route => route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: 'test-event-id'
        }));

        // Mock API endpoints to return meaningful data
        await page.route(/.*\/api\/v1\/eventTypes/, route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(eventTypes)
        }));
        await page.route(/.*\/api\/v1\/tags/, route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(tags)
        }));

        // Block SignalR negotiate endpoint to prevent the WebSocket connection
        // from succeeding (via Long Polling fallback) and overwriting mock localStorage data
        await page.route(/.*\/signalr\/events\/negotiate/, route => route.abort());

        // Mock time to match event dates (Jan 1, 2023)
        await page.clock.install({ time: new Date('2023-01-01T10:00:00.000Z') });

        // Inject mock data into localStorage
        await page.addInitScript(({ events, places }) => {
            localStorage.setItem('events', JSON.stringify(events));
            localStorage.setItem('places', JSON.stringify(places));

            // Compute days from events (mimic ProgramService logic)
            const days: Record<number, number> = {};
            events.forEach((event: any) => {
                const date = new Date(event.start);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                if (!days[startOfDay]) {
                    days[startOfDay] = startOfDay;
                }
            });
            localStorage.setItem('days', JSON.stringify(days));

            localStorage.setItem('language', 'en');
            localStorage.setItem('appEventId', 'test-event-id');
        }, { events, places });

        // Navigate to app
        await page.goto('/');
    });

    test('should display events for the default selected day', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // Verify day tabs are present
        const dayTabs = page.locator('mat-button-toggle');
        await expect(dayTabs).toHaveCount(2); // Based on mock data dates (Jan 1, Jan 2)

        // Verify default selection (first day)
        await expect(dayTabs.first()).toHaveClass(/mat-button-toggle-checked/);

        // Verify events from the first day are visible
        await expect(page.getByText('Opening Ceremony')).toBeVisible();
        await expect(page.getByText('Workshop 1')).toBeVisible();

        // Verify events from second day are NOT visible
        await expect(page.getByText('Concert')).toBeHidden();
    });

    test('should switch days and show relevant events', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // Click on the second day tab
        const dayTabs = page.locator('mat-button-toggle');
        await dayTabs.nth(1).click({ force: true });

        // Verify second day is selected
        await expect(dayTabs.nth(1)).toHaveClass(/mat-button-toggle-checked/);

        // Verify events from second day are visible
        await expect(page.getByText('Concert')).toBeVisible();

        // Verify events from first day are NOT visible
        await expect(page.getByText('Opening Ceremony')).toBeHidden();
    });

    test('should filter events by place', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // Open filter dialog
        await page.locator('button[mat-icon-button]').filter({ hasText: 'filter_list' }).click({ force: true });

        // Wait for the filter dialog to appear
        await expect(page.locator('mat-dialog-container')).toBeVisible();

        // Places are rendered as mat-option inside a multi-select mat-select dropdown
        // Click the mat-select trigger to open the dropdown
        await page.getByLabel('Place').click();

        // Select "Main Stage" from the dropdown options
        await page.getByRole('option', { name: 'Main Stage' }).click();

        // Close the multi-select dropdown (Escape closes the topmost overlay = dropdown, not the dialog)
        await page.keyboard.press('Escape');

        // Click Confirm to apply filters
        await page.getByRole('button', { name: 'Confirm' }).click();

        // Wait for the dialog to close
        await expect(page.locator('mat-dialog-container')).toBeHidden();

        // Verify only Main Stage events are visible on Day 1
        await expect(page.getByText('Opening Ceremony')).toBeVisible();
        await expect(page.getByText('Workshop 1')).toBeHidden(); // Workshop Tent
    });

    test('should filter by favorites', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // 1. Mark 'Opening Ceremony' as favorite by opening the bottom sheet
        await page.getByText('Opening Ceremony').first().click({ force: true });

        // Wait for the bottom sheet to appear
        await expect(page.locator('app-event-detail-preview')).toBeVisible();

        // Click the favorite button (first button in the controls area)
        await page.locator('app-event-detail-preview button:has(mat-icon)').first().evaluate(
            node => (node as HTMLElement).click()
        );

        // The bottom sheet dismisses itself after toggling favorite
        await expect(page.locator('app-event-detail-preview')).toBeHidden();

        // 2. Enable "Only Favorites" filter
        await page.locator('button[mat-icon-button]').filter({ hasText: 'filter_list' }).click({ force: true });

        // Toggle the mat-slide-toggle for "Only favorites"
        await page.getByText('Only favorites').click({ force: true });

        // Click Confirm to apply filters
        await page.getByRole('button', { name: 'Confirm' }).click({ force: true });

        // Wait for the dialog to close
        await expect(page.locator('mat-dialog-container')).toBeHidden();

        // 3. Verify only the favorited event is visible
        await expect(page.getByText('Opening Ceremony')).toBeVisible();
        await expect(page.getByText('Workshop 1')).toBeHidden();
    });
    test('should filter events by event type', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // Open filter dialog
        await page.locator('button[mat-icon-button]').filter({ hasText: 'filter_list' }).click({ force: true });

        // Wait for dialog
        await expect(page.locator('mat-dialog-container')).toBeVisible();

        // Click Event type selector
        await page.getByLabel('Event type').click();

        // Select "Workshop"
        const workshopOption = page.getByRole('option', { name: 'Workshop' });
        await workshopOption.click();

        // Wait for usage of checked class name or attribute to verify selection before closing
        // Angular Material options usually have aria-selected="true"
        await expect(workshopOption).toHaveAttribute('aria-selected', 'true');

        // Close dropdown
        await page.keyboard.press('Escape');

        // Wait for the dropdown overlay to disappear before clicking Confirm
        // The confirm button might be obscured if we don't wait
        await expect(workshopOption).toBeHidden();
        // Confirm
        await page.getByRole('button', { name: 'Confirm' }).click({ force: true });

        // Verify "Workshop 1" is visible, others hidden
        await expect(page.getByText('Workshop 1')).toBeVisible();
        await expect(page.getByText('Opening Ceremony')).toBeHidden();
    });

    test('should filter events by tags', async ({ page }) => {
        await expect(page.locator('app-full-program')).toBeVisible();

        // Open filter dialog
        await page.locator('button[mat-icon-button]').filter({ hasText: 'filter_list' }).click({ force: true });

        // Wait for dialog
        await expect(page.locator('mat-dialog-container')).toBeVisible();

        // Click Tags selector
        await page.getByLabel('Tags').click();

        const option = page.getByRole('option', { name: 'For Beginners' });
        await option.click();

        // Close dropdown
        await page.keyboard.press('Escape');
        await expect(option).toBeHidden();
        // Confirm
        await page.getByRole('button', { name: 'Confirm' }).click({ force: true });

        // Select "For Beginners" -> This is tag1 which Workshop 1 has
        await expect(page.getByText('Opening Ceremony')).toBeHidden();
    });
});
