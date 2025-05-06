# Yank.ai - Video Text Extractor

## Problem
Users often want to copy text from videos (like YouTube tutorials, presentations, etc.) but currently have to manually transcribe or use separate OCR tools, which is time-consuming and inefficient.

## Solution
Yank.ai is a browser extension that:
1. Lets users select a video frame
2. Uses OCR to extract text from the frame
3. Overlays the recognized text on the video for easy copying

## Key Features
- Works on YouTube videos
- Preserves text positioning and formatting
- Toggleable interface that appears when video is paused
- Lightweight and fast OCR processing

## Technology Stack
- **Tesseract.js** (OCR engine) - see `src/offscreen.js` for implementation
- **Chrome Extension API** - for cross-script communication and UI
- **Webpack** - for bundling and asset management
- **Offscreen Documents API** - for background OCR processing

## Installation
1. Clone the repository
2. Run `npm install`
3. Build with `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome

## Usage
1. Navigate to a YouTube video
2. Click the extension icon to enable
3. Pause the video and click the "ON" button
4. Text will appear overlaid on the video - select and copy as needed

## License
MIT - See `LICENSE` file for details
