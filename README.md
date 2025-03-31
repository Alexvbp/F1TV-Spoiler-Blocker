# F1TV Spoiler Blocker

A configurable browser extension for Chrome and Firefox designed to hide spoilers on the F1TV website. Browse VODs and race weekend pages without accidentally seeing results or revealing imagery.

## Features

*   **Configurable Blocking:** Choose your preferred method for handling spoiler images:
    *   **Blur Images:** Replaces potential spoiler images with a blurred version. 
        *   **Adjustable Intensity:** Control the amount of blur using a slider (5px to 50px).
    *   **Hide Images:** Replaces potential spoiler images with a neutral placeholder.
*   **Targeted Blocking:** Independently enable or disable spoiler blocking for:
    *   Video on Demand (VOD) thumbnails.
    *   Grand Prix weekend cards and banners.
*   **Popup Configuration:** Easily change settings via the extension's popup window.
*   **Light/Dark Mode:** The popup interface automatically adapts to your system's light or dark theme.
*   **Flash Prevention:** Uses an initial CSS-based block followed by JavaScript processing to minimize the chance of seeing spoilers flash before they are hidden or blurred.

## Installation

1.  Clone or download this repository to your local machine.
2.  **Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right).
    *   Click "Load unpacked" and select the directory where you saved the extension's code.
3.  **Firefox:**
    *   Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
    *   Click "Load Temporary Add-on...".
    *   Select the `manifest.json` file inside the directory where you saved the extension's code.

## Configuration

1.  Click the F1TV SpoilerBlock extension icon in your browser toolbar to open the popup.
2.  Select your preferred "Blocking Method" (Blur or Hide).
3.  If using Blur, adjust the "Blur Intensity" slider.
4.  Use the toggles to enable/disable blocking for "VOD Thumbnails" and "GP Weekend Cards/Banners".
5.  Click "Save Settings". Changes will be applied automatically (you may need to refresh the F1TV page for changes to take full effect).

## Development Files

*   `manifest.json`: Defines the extension's structure, permissions, and scripts.
*   `content.js`: Contains the core JavaScript logic that runs on F1TV pages to find and apply spoiler blocking based on saved settings.
*   `styles.css`: Contains default CSS hiding rules and styles applied by `content.js` for blurring and hiding elements.
*   `popup.html`: Defines the structure of the configuration popup window.
*   `popup.js`: Handles the logic within the popup: loading/saving settings and updating the UI.
*   `icons/`: Contains the extension icons used in the browser toolbar and extension management pages. 