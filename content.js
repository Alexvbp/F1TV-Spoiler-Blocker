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
  hidden: 'spoiler-hidden-image', // Class for the img tag when using placeholder
  // grayscale: 'spoiler-grayscale' // Removed
  // blackout: 'spoiler-blackout-image', // Needs container logic too
  // replace: 'spoiler-replace' // Needs src replacement logic
};
// Special class for the container when hiding
const hiddenContainerClass = 'spoiler-hidden-container'; // Class for the container span
// Special class for the banner image
const bannerBlurredClass = 'spoiler-banner-image-blurred';

// Class to mark elements processed by this script, overriding default CSS hide
const initializedClass = 'spoiler-block-initialized';

// Debounce timer variable
let debounceTimer = null;

function applySpoilers() {
  console.log(`Applying method: ${currentBlockingMethod}, VODs: ${shouldBlockVods}, GPs: ${shouldBlockGps}`);
  const blockingClass = methodClasses[currentBlockingMethod] || methodClasses.blurred;

  let elementsFound = 0;

  // Helper function to apply the class or style
  const applyClass = (selector, typeName, applyToContainer = false, containerSelector = 'span.item-image-container') => {
    console.log(`[SpoilerBlock] applyClass called for selector: "${selector}", type: ${typeName}, method: ${currentBlockingMethod}`);
    let elementsFoundThisCall = 0; // Counter for this specific call
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
           containerElement.classList.add(initializedClass); // Mark as processed
        }
        // Also remove banner blur class specifically
        if(selector === gpBannerSelector) targetElement.classList.remove(bannerBlurredClass);

        // Apply selected method
        if (currentBlockingMethod === 'hidden' && applyToContainer) {
             if (containerElement) {
                containerElement.classList.add(hiddenContainerClass);
                targetElement.classList.add(methodClasses.hidden); // Apply hidden class to image within container
                elementsFoundThisCall++;
             } else {
                 console.warn(`Could not find container for hidden element: ${typeName}`, el);
             }
        } else if (selector === gpBannerSelector) { // Specific handling for GP Banner image blur
             if (!targetElement.classList.contains(bannerBlurredClass)) {
                 targetElement.classList.add(bannerBlurredClass);
                 elementsFoundThisCall++;
             }
        } else {
             // Apply blur method using inline style
             if (currentBlockingMethod === 'blurred') {
                 targetElement.style.filter = `blur(${currentBlurAmount}px)`;
                 elementsFoundThisCall++;
                 // Also mark VOD/GP container as initialized if not already done (redundancy is ok)
                 if (!applyToContainer) { // Only if we didn't already find container above
                    let blurContainer = el.closest('span.item-image-container');
                    if(blurContainer) blurContainer.classList.add(initializedClass);
                 }
             } else {
                 // Apply other methods (none currently besides hidden)
             }
        }

        // Increment count if we successfully added the initialized class (meaning we processed it)
        if ((containerElement && containerElement.classList.contains(initializedClass)) || 
            (selector === gpBannerSelector && targetElement.classList.contains(bannerBlurredClass)) || // Banner case
            (currentBlockingMethod === 'blurred' && targetElement.style.filter) ) { // Blur case
             elementsFoundThisCall++;
        }
      });

      // Log summary after processing all elements for this selector
      if (elementsFoundThisCall > 0) {
          if (currentBlockingMethod === 'hidden' && applyToContainer) {
              console.log(`[SpoilerBlock] Applied 'hidden' to ${elementsFoundThisCall} containers for selector: "${selector}"`);
          } else if (currentBlockingMethod === 'blurred') {
              console.log(`[SpoilerBlock] Applied 'blur(${currentBlurAmount}px)' to ${elementsFoundThisCall} elements for selector: "${selector}"`);
          } else if (selector === gpBannerSelector && currentBlockingMethod !== 'hidden') { // Banner blur uses class currently
              console.log(`[SpoilerBlock] Applied banner class to ${elementsFoundThisCall} elements for selector: "${selector}"`);
          }
      }

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
        
        // Find container and remove initialized/hidden classes
        let containerElement = null;
        if (isContainerBased) {
             containerElement = el.closest(containerSelector);
             if (containerElement) {
                 containerElement.classList.remove(hiddenContainerClass);
                 containerElement.classList.remove(initializedClass); // Remove initialized class
             }
        }

        // Remove classes from the image itself
        el.classList.remove(methodClasses.hidden);

        // Special handling for GP banner
        if (selector === gpBannerSelector) {
            el.classList.remove(bannerBlurredClass);
            const bannerContainer = el.closest('div.gp-banner-main-container'); // Adjust if selector changes
            if(bannerContainer) bannerContainer.classList.remove(initializedClass);
        }
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
}

// Function to load settings and then apply spoilers
function loadSettingsAndApply() {
  chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps', 'blurAmount'], function(items) {
    console.log('[SpoilerBlock] loadSettingsAndApply: Retrieved settings on load/update:', items);
    if (chrome.runtime.lastError) {
        console.error("[SpoilerBlock] Error retrieving settings:", chrome.runtime.lastError);
        // Proceed with defaults if loading fails
    } else {
        currentBlockingMethod = items.blockingMethod || 'blurred';
        shouldBlockVods = items.blockVods !== undefined ? items.blockVods : true;
        shouldBlockGps = items.blockGps !== undefined ? items.blockGps : true;
        currentBlurAmount = items.blurAmount || 15; // Load blur amount
    }
    console.log(`[SpoilerBlock] loadSettingsAndApply: Applying with method='${currentBlockingMethod}', blur=${currentBlurAmount}px, blockVods=${shouldBlockVods}, blockGps=${shouldBlockGps}`);
    applySpoilers(); // Apply based on loaded (or default) settings
  });
}

// Initial load
console.log("[SpoilerBlock] Content script initializing... Loading initial settings.");
// Just load settings initially, don't apply yet. Observer will trigger first application.
chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps', 'blurAmount'], function(items) {
    if (chrome.runtime.lastError) {
        console.error("[SpoilerBlock] Initial settings load failed:", chrome.runtime.lastError);
        // Defaults are set globally, so we can proceed
    } else {
        console.log('[SpoilerBlock] Initial settings loaded:', items);
        currentBlockingMethod = items.blockingMethod || 'blurred';
        shouldBlockVods = items.blockVods !== undefined ? items.blockVods : true;
        shouldBlockGps = items.blockGps !== undefined ? items.blockGps : true;
        currentBlurAmount = items.blurAmount || 15;
    }
});

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
       // Clear the existing timer if it exists
       clearTimeout(debounceTimer);
       // Set a new timer to run applySpoilers after a short delay
       debounceTimer = setTimeout(() => {
           console.log("[SpoilerBlock] Debounced MutationObserver triggering applySpoilers...");
           applySpoilers(); 
       }, 200); // Wait 200 milliseconds after the last detected change
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