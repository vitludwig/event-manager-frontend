# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- Capacitor Rules ---
# Zachovat Capacitor Bridge a hlavní třídy
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Zachovat všechny třídy pluginů (jinak volání z JS selže)
-keep public class * extends com.getcapacitor.Plugin

# Zachovat WebView konfigurace
-keep public class * extends android.webkit.WebViewClient
-keep public class * extends android.webkit.WebChromeClient

# --- Ionic/Angular Specifics (pokud používáte) ---
# Často potřeba pro správné fungování dependency injection v některých knihovnách
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# --- Third Party Plugins ---
# Pokud používáte specifické nativní knihovny (např. Google Maps, Firebase),
# zkontrolujte jejich dokumentaci pro ProGuard pravidla.
# Příklad: -keep class com.google.firebase.** { *; }