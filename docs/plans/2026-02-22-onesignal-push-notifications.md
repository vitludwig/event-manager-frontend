# OneSignal Push Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable OneSignal push notifications on both Android and iOS by replacing the Cordova plugin with the native Capacitor SDK and extending initialization to iOS.

**Architecture:** Replace `onesignal-cordova-plugin` with `onesignal-capacitor` (identical API, better native support). Remove the Android-only guard in `NotificationService` so OneSignal initializes on both platforms. Add the `POST_NOTIFICATIONS` permission for Android 13+. Manual Xcode capability steps are documented as a checklist.

**Tech Stack:** Angular 21, Capacitor 7, `onesignal-capacitor` v5, Firebase FCM (Android), APNs (iOS)

---

## Prerequisites checklist (complete BEFORE starting code tasks)

These are one-time manual steps that cannot be automated. Check them off before touching code.

### Android — Firebase setup
- [ ] Go to [https://console.firebase.google.com](https://console.firebase.google.com)
- [ ] Create a new Firebase project (or use an existing one)
- [ ] Inside the project: **Add app** → Android → package name `cz.rzbit.eventApp`
- [ ] Download `google-services.json`
- [ ] Copy it to `android/app/google-services.json`

### Android — OneSignal dashboard
- [ ] Log in to [https://app.onesignal.com](https://app.onesignal.com)
- [ ] Open your app (App ID `260dd1c8-ce92-4821-a870-1c5f88439bf5` for dev / `14d3b005-8f00-478a-b84e-14807cf26f99` for prod)
- [ ] Settings → Platforms → **Google Android (FCM)**
- [ ] In Firebase Console → Project Settings → Cloud Messaging → copy **Server Key**
- [ ] Paste the Server Key into OneSignal

### iOS — APNs key setup
- [ ] Go to [https://developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles → **Keys**
- [ ] Create a new key, enable **Apple Push Notifications service (APNs)**
- [ ] Download the `.p8` file — **you can only download it once**
- [ ] Note your **Key ID** and **Team ID** (visible in Membership section)
- [ ] In OneSignal → Settings → Platforms → **Apple iOS (APNs)**
- [ ] Upload the `.p8` file and enter Key ID and Team ID

### iOS — Xcode capabilities (do this after Task 3 below)
- [ ] Open `ios/App/App.xcodeproj` in Xcode
- [ ] Select the `App` target → **Signing & Capabilities** tab
- [ ] Click **+ Capability** → add **Push Notifications**
- [ ] Click **+ Capability** → add **Background Modes** → check **Remote notifications**

---

## Task 1: Replace npm package

**Files:**
- Modify: `package.json`

**Step 1: Remove the Cordova plugin and add the native Capacitor SDK**

```bash
npm remove onesignal-cordova-plugin
npm install onesignal-capacitor
```

Expected: no errors. `package.json` now has `"onesignal-capacitor"` instead of `"onesignal-cordova-plugin"`.

**Step 2: Sync Capacitor**

```bash
npx cap sync
```

Expected output includes something like:
```
✔ Updating Android plugins
✔ Updating iOS plugins
✔ Copying web assets
```

For iOS, `cap sync` automatically adds the OneSignal CocoaPod entry to `ios/App/Podfile`. Verify it appears:

```bash
grep -i onesignal ios/App/Podfile
```

Expected: at least one line containing `OneSignal`.

**Step 3: Install iOS pods**

```bash
cd ios/App && pod install && cd ../..
```

Expected: CocoaPods installs OneSignal pod without errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json ios/App/Podfile ios/App/Podfile.lock
git commit -m "chore: replace onesignal-cordova-plugin with onesignal-capacitor"
```

---

## Task 2: Update NotificationService

**Files:**
- Modify: `src/app/modules/notifications/services/notification/notification.service.ts`

The only behavioral change is: OneSignal now initializes on iOS as well as Android. The API is identical.

**Step 1: Update the import line**

In `notification.service.ts` line 6, change:

```typescript
// Before
import OneSignal  from 'onesignal-cordova-plugin';

// After
import OneSignal from 'onesignal-capacitor';
```

**Step 2: Rename the method and remove the Android guard**

Find `initOneSignalCapacitor()` (currently called in constructor at line 37, defined starting at line 109).

Replace the entire method with:

```typescript
private initOneSignal() {
    // TODO: disable verbose logging before publishing to stores
    OneSignal.Debug.setLogLevel(6);
    OneSignal.initialize(environment.oneSignalAppId);
    // Requests permission at launch. On iOS this shows the system dialog.
    // On Android 13+ this also triggers the POST_NOTIFICATIONS runtime dialog.
    OneSignal.Notifications.requestPermission(false).then((accepted: boolean) => {
        console.log("User accepted notifications: " + accepted);
    });

    OneSignal.Notifications.addEventListener('click', () => this.router.navigate([`/${ERoute.NOTIFICATIONS}`]));
}
```

Also update the constructor call from `this.initOneSignalCapacitor()` to `this.initOneSignal()`.

**Step 3: Verify TypeScript compiles**

```bash
npx ng build --configuration development 2>&1 | head -40
```

Expected: build completes without TypeScript errors.

**Step 4: Commit**

```bash
git add src/app/modules/notifications/services/notification/notification.service.ts
git commit -m "feat: enable OneSignal push notifications on iOS alongside Android"
```

---

## Task 3: Add POST_NOTIFICATIONS permission for Android 13+

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

Android 13 (API 33) requires an explicit runtime permission for push notifications. Without it, no notification is shown on modern Android.

**Step 1: Add the permission to AndroidManifest.xml**

Open `android/app/src/main/AndroidManifest.xml`. After the existing `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />` line (currently line 39), add:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

The permissions block should now read:

```xml
<!-- Permissions -->

<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**Step 2: Sync Capacitor again to propagate manifest changes**

```bash
npx cap sync android
```

**Step 3: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat: add POST_NOTIFICATIONS permission for Android 13+"
```

---

## Task 4: Verify end-to-end on Android

**Prerequisites:** `google-services.json` must be in `android/app/` (see Prerequisites checklist above).

**Step 1: Build and open in Android Studio**

```bash
npm run android
```

This runs: `ng build --configuration development-android && cap sync android && cap open android`

**Step 2: Run on a physical device or emulator**

In Android Studio: select a device → Run.

**Step 3: Verify OneSignal initialization**

In Android Studio Logcat, filter by `OneSignal`:
- Should see: `"OneSignal SDK initialized"`
- Should see the permission dialog appear (first launch)
- Should see: `"User accepted notifications: true"` (or false if denied)

**Step 4: Send a test notification from OneSignal**

In OneSignal dashboard → **Messages** → **New Push** → **Send to Test Device** (or All Users).

Expected: notification appears in the Android notification tray.

---

## Task 5: Verify end-to-end on iOS

**Prerequisites:** Xcode capabilities must be added (see Prerequisites checklist — iOS Xcode section) and APNs must be configured in OneSignal.

**Note:** iOS push notifications require a **physical device** — they do not work in the simulator.

**Step 1: Build and open in Xcode**

```bash
npm run ios
```

This runs: `ng build --configuration development-ios && cap sync ios && cap open ios`

**Step 2: Run on a physical iOS device**

In Xcode: select your physical device → Run.

**Step 3: Verify OneSignal initialization**

In Xcode console, look for:
- OneSignal SDK initialized message
- System permission dialog appearing on first launch

**Step 4: Send a test notification from OneSignal**

Same as Task 4 Step 4.

Expected: notification appears in iOS notification center.

---

## Post-implementation: disable verbose logging for production

Before building release:

In `NotificationService.initOneSignal()`, remove or comment out:

```typescript
OneSignal.Debug.setLogLevel(6);
```

Or guard it:

```typescript
if (!environment.production) {
    OneSignal.Debug.setLogLevel(6);
}
```

Add a `production: true` flag to `environment.ts` if not already present.
