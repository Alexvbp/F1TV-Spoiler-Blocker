/* Content script for F1TV Spoiler Blocker */

console.log("F1TV Spoiler Blocker content script loaded.");

// Global variables to hold settings
let currentBlockingMethod = 'blurred'; // Default
let shouldBlockVods = true; // Default
let shouldBlockGps = true; // Default

// Selectors
const vodImageSelector = 'a.video-card-item span.item-image-container img';
const gpImageSelector = 'a.bundle-card-item span.item-image-container img';

// CSS classes corresponding to methods
const methodClasses = {
  blurred: 'spoiler-blurred',
  hidden: 'spoiler-hidden-image', // Apply this to the image itself
  grayscale: 'spoiler-grayscale'
  // blackout: 'spoiler-blackout-image', // Needs container logic too
  // replace: 'spoiler-replace' // Needs src replacement logic
};
// Special class for the container when hiding
const hiddenContainerClass = 'spoiler-hidden-container';

function applySpoilers() {
  console.log(`Applying method: ${currentBlockingMethod}, VODs: ${shouldBlockVods}, GPs: ${shouldBlockGps}`);
  const blockingClass = methodClasses[currentBlockingMethod] || methodClasses.blurred;

  let elementsFound = 0;

  // Helper function to apply the class
  const applyClass = (selector, typeName) => {
    try {
      const images = document.querySelectorAll(selector);
      images.forEach(img => {
        const container = img.closest('span.item-image-container'); // Find the container
        
        // Remove other potential spoiler classes first
        Object.values(methodClasses).forEach(cls => img.classList.remove(cls));
        if (container) {
           container.classList.remove(hiddenContainerClass);
        }

        // Apply selected method
        if (currentBlockingMethod === 'hidden') {
             if (container) {
                container.classList.add(hiddenContainerClass);
             } else {
                 console.warn('Could not find container for hidden image:', img);
             }
             img.classList.add(methodClasses.hidden); // Apply hidden class to image
             elementsFound++;
        } else {
             // Apply other methods directly to the image
             const blockingClass = methodClasses[currentBlockingMethod] || methodClasses.blurred;
             if (!img.classList.contains(blockingClass)) {
                 img.classList.add(blockingClass);
                 elementsFound++;
                // console.log(`Applied ${blockingClass} to ${typeName} image:`, img);
             }
        }
      });
    } catch (error) {
      console.error(`Error applying selector "${selector}":`, error);
    }
  };

  // Clear existing styles if elements shouldn't be blocked anymore
  const clearClass = (selector) => {
     try {
      const images = document.querySelectorAll(selector);
      images.forEach(img => {
        Object.values(methodClasses).forEach(cls => img.classList.remove(cls));
        // Also remove the container class if it exists
        const container = img.closest('span.item-image-container');
        if (container) {
          container.classList.remove(hiddenContainerClass);
        }
      });
    } catch (error) {
       console.error(`Error clearing selector "${selector}":`, error);
    }
  }

  // Apply based on settings
  if (shouldBlockVods) {
    applyClass(vodImageSelector, 'VOD');
  } else {
    clearClass(vodImageSelector); // Remove styles if disabled
  }

  if (shouldBlockGps) {
    applyClass(gpImageSelector, 'GP');
  } else {
    clearClass(gpImageSelector); // Remove styles if disabled
  }

  if (elementsFound > 0) {
    console.log(`Applied ${blockingClass} to ${elementsFound} new images.`);
  }
}

// Function to load settings and then apply spoilers
function loadSettingsAndApply() {
  chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps'], function(items) {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        // Proceed with defaults if loading fails
    } else {
        currentBlockingMethod = items.blockingMethod || 'blurred';
        shouldBlockVods = items.blockVods !== undefined ? items.blockVods : true;
        shouldBlockGps = items.blockGps !== undefined ? items.blockGps : true;
    }
    applySpoilers(); // Apply based on loaded (or default) settings
  });
}

// Initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSettingsAndApply);
} else {
  loadSettingsAndApply();
}

// Update via MutationObserver
const observer = new MutationObserver((mutationsList) => {
  let needsUpdate = false;
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
       // Basic check: Did new nodes get added?
       // More sophisticated check could look if added nodes match selectors
       needsUpdate = true;
       break; 
    }
  }
  if (needsUpdate) {
       // Debounce could be added here if applySpoilers gets called too often
       applySpoilers(); 
  }
});

// Observe body
observer.observe(document.body, { childList: true, subtree: true });

// Optional: Listen for messages from popup to update immediately (if needed)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is from our extension's popup (optional but good practice)
  if (sender.id === chrome.runtime.id && request.action === "settingsUpdated") {
    console.log("Received settings update message from popup.");
    loadSettingsAndApply(); // Reload settings and re-apply spoilers
    // Send simple response to acknowledge receipt (optional)
    sendResponse({status: "Settings received by content script"});
  } else {
    // Handle other messages or ignore
    sendResponse({status: "Unknown message"}); 
  }
  return true; // Keep the message channel open for asynchronous response if needed
}); 