# bedrock-vue-barcode-scanner ChangeLog

## 1.6.1 - 2025-07-02

### Fixed
- Fix camera config to allow video stream to render back camera on Android.

## 1.6.0 - 2025-06-30

### Added
- Include safe area CSS property for mobile devices.

## Changed
- Update screen aspect ratio for web and mobile.

## 1.5.0 - 2025-04-27

### Added
- Provide property to automatically light torch when initialized.

### Changed
- Do not light torch by default.

## 1.4.0 - 2025-04-03

### Changed
- Use Barcode Detection API to detect barcodes.

## 1.3.1 - 2025-03-11

### Changed
- Update CSS to enable vertical scrolling.

## 1.3.0 - 2025-03-10

### Changed
- Add zoom icons to slider.
- Prevent pinch to zoom (since it presently scales the website and
  not the camera, which can be confusing UX). A future update
  might add pinch to zoom that scales the camera.

## 1.2.0 - 2025-03-10

### Added
- Include slider to control camera zoom.

## 1.1.0 - 2025-02-11

### Added
- Add `showQrBox` prop allowing user to see square QR box when scanning.

### Fixed
- Default camera selection to a back-facing non-fisheye camera.

## 1.0.1 - 2025-02-02

### Fixed
- Removed debug console logging.

## 1.0.0 - 2025-02-02

- See git history for changes.
