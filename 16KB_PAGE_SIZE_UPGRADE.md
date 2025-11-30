# 16 KB Page Size Support - Upgrade Guide

## ✅ Completed Upgrades

### 1. Android Gradle Plugin (AGP)

- **Upgraded**: 8.3.0 → **8.5.1**
- **Location**: `android/build.gradle`
- **Why**: AGP 8.5.1+ is required for proper 16 KB alignment in AAB bundles (not just APKs)

### 2. NDK Version

- **Upgraded**: 26.2.11394342 → **27.1.12297006**
- **Location**: `android/build.gradle`
- **Why**: NDK r27+ provides first-class 16 KB page size support

### 3. Gradle Wrapper

- **Current**: 8.7 ✅ (Already compatible with AGP 8.5.1)
- **Location**: `android/gradle/wrapper/gradle-wrapper.properties`

## ⚠️ Required: React Native Upgrade

### Current Status

- **Current Version**: React Native 0.74.4
- **Required Version**: React Native 0.77+ (or 0.80+)
- **Why**: React Native 0.77+ includes full 16 KB page size support with all bundled native libraries (.so files) properly aligned

### Upgrade Steps

1. **Backup your project** (create a git commit or branch)

2. **Update React Native**:

   ```bash
   npm install react-native@latest
   # or specifically:
   npm install react-native@0.77.0
   ```

3. **Run the upgrade helper**:

   ```bash
   npx react-native upgrade
   ```

4. **Update dependencies**:

   ```bash
   npm install
   cd android
   ./gradlew clean
   cd ..
   ```

5. **Test thoroughly**:
   - Build and test on Android
   - Verify all features work correctly
   - Test on a device/emulator with 16 KB page size if possible

### Important Notes

- React Native 0.77+ is the **only reliable way** to ensure all React Native internal `.so` files are 16 KB-aligned
- Without this upgrade, some native libraries may still fail the Play Store 16 KB check
- The upgrade may require updating other dependencies and fixing breaking changes

## 📋 Next Steps

1. **Install NDK 27.1.12297006** (if not already installed):

   - Open Android Studio
   - Go to Tools → SDK Manager → SDK Tools
   - Check "Show Package Details"
   - Find "NDK (Side by side)" and install version 27.1.12297006

2. **Sync Gradle**:

   ```bash
   cd android
   ./gradlew clean
   ```

3. **Build Release Bundle**:

   ```bash
   cd android
   ./gradlew bundleRelease
   ```

4. **Verify 16 KB Support**:
   - Upload AAB to Play Console
   - Play Console will automatically verify 16 KB support
   - Or use Android Studio APK Analyzer to check `.so` file alignment

## 📚 References

- [Android 16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [React Native 0.77 Release Notes](https://reactnative.dev/blog/2025/01/21/version-0.77)
- [AGP 8.5.1 Release Notes](https://developer.android.com/build/releases/gradle-plugin)

## ⏰ Deadline

**May 31, 2026** - All apps targeting Android 15+ must support 16 KB page sizes
