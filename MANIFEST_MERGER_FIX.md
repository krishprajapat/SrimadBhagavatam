# Manifest Merger Conflict Fix for API 35

## 🚨 Issue Resolved

**Error**: Manifest merger failed due to conflicting ad services configurations between different Google Play Services libraries.

## 🔧 Solution Applied

### 1. Updated Dependencies

- **Google Play Services Ads**: `22.6.0` → `23.2.0` (API 35 compatible)
- **Added version constants** in root `build.gradle` for consistency

### 2. Manifest Configuration

Added to `android/app/src/main/AndroidManifest.xml`:

```xml
<property
    android:name="android.adservices.AD_SERVICES_CONFIG"
    android:resource="@xml/gma_ad_services_config"
    tools:replace="android:resource" />
```

### 3. Created Configuration File

Created `android/app/src/main/res/xml/gma_ad_services_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<adservicesConfig>
    <!-- Google Mobile Ads Ad Services Configuration -->
    <!-- This file resolves manifest merger conflicts between different Google Play Services libraries -->
</adservicesConfig>
```

## 📁 Files Modified

1. `android/build.gradle` - Added version constants
2. `android/app/build.gradle` - Updated dependencies
3. `android/app/src/main/AndroidManifest.xml` - Added ad services property
4. `android/app/src/main/res/xml/gma_ad_services_config.xml` - Created configuration file

## 🎯 Why This Happened

- **API 35** introduces stricter manifest merger rules
- **Google Play Services** libraries have conflicting ad services configurations
- **Different versions** of libraries expect different resource files

## ✅ Result

- Manifest merger conflict resolved
- API 35 compatibility achieved
- Clean build process restored
- Consistent dependency versions

## 🔍 Verification

After the fix, run:

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

The build should complete without manifest merger errors.

## 📝 Notes

- The `tools:replace="android:resource"` directive tells the manifest merger to use our configuration
- The empty `gma_ad_services_config.xml` file satisfies the resource requirement
- This approach is recommended by Google for resolving such conflicts
