/* Content script for F1TV Spoiler Blocker */

console.log("F1TV Spoiler Blocker content script loaded.");

// Global variables to hold settings
let currentBlockingMethod = 'blurred'; // Default
let shouldBlockVods = true; // Default
let shouldBlockGps = true; // Default
let currentBlurAmount = 15; // Default

// Selectors
const vodImageSelector = 'a.video-card-item span.item-image-container img';
const gpImageSelector = 'a.bundle-card-item span.item-image-container img';
const gpBannerSelector = 'div.gp-banner-main-container img.gp-banner-image'; // Target the image inside banner

// CSS classes corresponding to methods
const methodClasses = {
  // blurred: 'spoiler-blurred', // No longer using class for blur
  hidden: 'spoiler-hidden-image',
  // grayscale: 'spoiler-grayscale' // Removed
  // blackout: 'spoiler-blackout-image', // Needs container logic too
  // replace: 'spoiler-replace' // Needs src replacement logic
};
// Special class for the container when hiding
const hiddenContainerClass = 'spoiler-hidden-container';
// Special class for the banner image
const bannerBlurredClass = 'spoiler-banner-image-blurred';

function applySpoilers() {
  console.log(`Applying method: ${currentBlockingMethod}, VODs: ${shouldBlockVods}, GPs: ${shouldBlockGps}`);
  const blockingClass = methodClasses[currentBlockingMethod] || methodClasses.blurred;

  let elementsFound = 0;

  // Helper function to apply the class or style
  const applyClass = (selector, typeName, applyToContainer = false, containerSelector = 'span.item-image-container') => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        let targetElement = el; // Element to apply standard blur/grayscale to
        let containerElement = null;

        if (applyToContainer) {
            containerElement = el.closest(containerSelector); // Find the container for hiding
        }
        
        // Remove other potential spoiler classes/styles first
        Object.values(methodClasses).forEach(cls => targetElement.classList.remove(cls));
        targetElement.style.filter = ''; // Clear inline blur filter
        if (containerElement) {
           containerElement.classList.remove(hiddenContainerClass);
        }
        // Also remove banner blur class specifically
        if(selector === gpBannerSelector) targetElement.classList.remove(bannerBlurredClass);


        // Apply selected method
        if (currentBlockingMethod === 'hidden' && applyToContainer) {
             if (containerElement) {
                containerElement.classList.add(hiddenContainerClass);
                targetElement.classList.add(methodClasses.hidden); // Apply hidden class to image within container
                elementsFound++;
             } else {
                 console.warn(`Could not find container for hidden element: ${typeName}`, el);
             }
        } else if (selector === gpBannerSelector) { // Specific handling for GP Banner image blur
             if (!targetElement.classList.contains(bannerBlurredClass)) {
                 targetElement.classList.add(bannerBlurredClass);
                 elementsFound++;
             }
        } else {
             // Apply blur method using inline style
             if (currentBlockingMethod === 'blurred') {
                 targetElement.style.filter = `blur(${currentBlurAmount}px)`;
                 elementsFound++;
             } else {
                 // Apply other methods (none currently besides hidden)
             }
        }
      });
    } catch (error) {
      console.error(`Error applying selector "${selector}":`, error);
    }
  };

  // Clear existing styles if elements shouldn't be blocked anymore
  const clearClass = (selector, isContainerBased = false, containerSelector = 'span.item-image-container') => {
     try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Remove standard method classes
        Object.values(methodClasses).forEach(cls => el.classList.remove(cls));
        el.style.filter = ''; // Clear inline blur filter
        
        // Also remove the container class if it exists and method was hidden
        if (isContainerBased) {
            const container = el.closest(containerSelector);
            if (container) {
                container.classList.remove(hiddenContainerClass);
            }
        }
        // Remove banner class specifically
        if (selector === gpBannerSelector) el.classList.remove(bannerBlurredClass);

      });
    } catch (error) {
       console.error(`Error clearing selector "${selector}":`, error);
    }
  }

  // Apply based on settings
  if (shouldBlockVods) {
    applyClass(vodImageSelector, 'VOD', true); // Third arg true = applyToContainer for hidden
  } else {
    clearClass(vodImageSelector, true); // Third arg true = isContainerBased for clearing
  }

  if (shouldBlockGps) {
    applyClass(gpImageSelector, 'GP', true); // ApplyToContainer for hidden
    applyClass(gpBannerSelector, 'GP Banner Image'); // Apply directly (blur) to banner image
  } else {
    clearClass(gpImageSelector, true);
    clearClass(gpBannerSelector);
  }

  if (elementsFound > 0) {
    console.log(`Applied ${blockingClass} to ${elementsFound} new images.`);
  }
}

// Function to load settings and then apply spoilers
function loadSettingsAndApply() {
  chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps', 'blurAmount'], function(items) {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        // Proceed with defaults if loading fails
    } else {
        currentBlockingMethod = items.blockingMethod || 'blurred';
        shouldBlockVods = items.blockVods !== undefined ? items.blockVods : true;
        shouldBlockGps = items.blockGps !== undefined ? items.blockGps : true;
        currentBlurAmount = items.blurAmount || 15; // Load blur amount
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