# OneSignal Push Notifications — Design

**Date:** 2026-02-22
**App:** RZB Festival (`cz.rzbit.eventApp`)
**Stack:** Angular 21, Capacitor 7, Android + iOS
**Approach:** B — Plugin swap + light cleanup

---

## Goal

Enable OneSignal push notifications on both Android and iOS native builds published via Capacitor. The app already has OneSignal working for Android via the Cordova plugin. The work extends this to iOS and migrates to the native Capacitor SDK.

---

## Section 1 — Package changes

- Remove `onesignal-cordova-plugin` from `package.json`
- Add `onesignal-capacitor` (v5.x — identical API)
- Run `npm install && npx cap sync`
  - `cap sync` automatically adds the OneSignal CocoaPod to `ios/App/Podfile` and installs it

---

## Section 2 — NotificationService code changes

File: `src/app/modules/notifications/services/notification/notification.service.ts`

1. Update import:
   - From: `import OneSignal from 'onesignal-cordova-plugin'`
   - To: `import OneSignal from 'onesignal-capacitor'`

2. Rename `initOneSignalCapacitor()` → `initOneSignal()` for clarity.

3. Remove the `Capacitor.getPlatform() === 'android'` guard from `initOneSignal()`.
   Both platforms use the same initialization code:
   - `OneSignal.Debug.setLogLevel(6)` (remove or guard for production)
   - `OneSignal.initialize(environment.oneSignalAppId)`
   - `OneSignal.Notifications.requestPermission(false)` — works on Android and iOS
   - `OneSignal.Notifications.addEventListener('click', ...)` — works on both platforms

4. Keep the notification channel creation (`createDefaultLocalNotificationChannel`) Android-only — iOS does not use channels.

5. Keep `addNotificationActionListeners()` Android-only — for local (scheduled) notifications; OneSignal handles click events natively on iOS.

---

## Section 3 — iOS native setup (manual steps in Xcode)

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the `App` target → **Signing & Capabilities** tab
3. Add **Push Notifications** capability
4. Add **Background Modes** capability → check **Remote notifications**
5. After `cap sync` adds the OneSignal pod, run `pod install` inside `ios/App/`

Note: `capacitor.config.ts` already has `handleApplicationNotifications: false` for iOS — no change needed.

---

## Section 4 — Android native setup

1. Go to Firebase Console → create a project (or use existing)
2. Add Android app with package name `cz.rzbit.eventApp`
3. Download `google-services.json` → place at `android/app/google-services.json`
4. The `build.gradle` already applies the `google-services` plugin — no code change needed

5. Add `POST_NOTIFICATIONS` permission to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```
   Required for Android 13+ (API 33+).

---

## Section 5 — OneSignal dashboard setup (one-time, manual)

**Android (FCM):**
1. In Firebase Console → Project Settings → Cloud Messaging → copy the Server Key
2. In OneSignal dashboard → your app → Platform settings → Google Android (FCM) → paste Server Key

**iOS (APNs):**
1. In Apple Developer Portal → Certificates, Identifiers & Profiles → Keys → create an APNs key (`.p8`)
   - Note the Key ID and Team ID
2. In OneSignal dashboard → your app → Platform settings → Apple iOS (APNs) → upload `.p8` with Key ID and Team ID

**App credentials:** Already configured in all environment files (`oneSignalAppId`, `oneSignalApiKey`). No code change needed.

---

## Files changed by code

| File | Change |
|------|--------|
| `package.json` | Replace `onesignal-cordova-plugin` with `onesignal-capacitor` |
| `src/app/modules/notifications/services/notification/notification.service.ts` | Update import, rename method, remove Android guard from OneSignal init |
| `android/app/src/main/AndroidManifest.xml` | Add `POST_NOTIFICATIONS` permission |

## Manual steps (outside code)

| Step | Platform | Done by |
|------|----------|---------|
| Place `google-services.json` in `android/app/` | Android | Developer |
| Add Push Notifications capability in Xcode | iOS | Developer |
| Add Background Modes (Remote notifications) in Xcode | iOS | Developer |
| Run `pod install` after `cap sync` | iOS | Developer |
| Configure FCM in OneSignal dashboard | Android | Developer |
| Configure APNs in OneSignal dashboard | iOS | Developer |
