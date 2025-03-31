# F1TV Spoiler Blocker

A browser extension for Chrome and Firefox to hide spoilers on the F1TV website, allowing users to browse VODs without seeing results prematurely.

## Features

*   Hides potential spoiler elements (e.g., results, thumbnails) on F1TV.

## Installation

1.  Clone or download this repository.
2.  **Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right).
    *   Click "Load unpacked" and select the directory containing this code.
3.  **Firefox:**
    *   Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
    *   Click "Load Temporary Add-on...".
    *   Select the `manifest.json` file inside the directory containing this code.

## Development

*   `manifest.json`: Defines the extension's structure and permissions.
*   `content.js`: Contains the JavaScript logic to identify and hide spoilers on F1TV pages.
*   `styles.css`: Contains CSS rules used by `content.js` to hide elements.
*   `icons/`: Contains the extension icons. 