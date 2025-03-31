// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');
  const blockingMethodRadios = document.querySelectorAll('input[name="blockingMethod"]');
  const blockVodsCheckbox = document.getElementById('blockVods');
  const blockGpsCheckbox = document.getElementById('blockGps');
  const blurAmountSlider = document.getElementById('blurAmount');
  const blurValueSpan = document.getElementById('blurValue');
  const blurOptionsDiv = document.getElementById('blurOptions');

  // Function to show/hide blur slider based on radio selection
  function toggleBlurSlider() {
      const selectedMethod = document.querySelector('input[name="blockingMethod"]:checked').value;
      blurOptionsDiv.style.display = selectedMethod === 'blurred' ? 'block' : 'none';
  }

  // Load saved settings when the popup opens
  chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps', 'blurAmount'], function(items) {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        statusDiv.textContent = 'Error loading settings.';
        statusDiv.style.color = 'var(--status-text-error)';
        return;
    }

    const savedMethod = items.blockingMethod || 'blurred'; // Default to blurred
    blockingMethodRadios.forEach(radio => {
      if (radio.value === savedMethod) {
        radio.checked = true;
      } else {
        radio.checked = false;
      }
    });

    // Default checkboxes to true (checked) if no setting saved
    blockVodsCheckbox.checked = items.blockVods !== undefined ? items.blockVods : true;
    blockGpsCheckbox.checked = items.blockGps !== undefined ? items.blockGps : true;

    // Set slider value and display
    const savedBlurAmount = items.blurAmount || 15; // Default to 15px
    blurAmountSlider.value = savedBlurAmount;
    blurValueSpan.textContent = savedBlurAmount;

    // Initial toggle for slider visibility
    toggleBlurSlider();
  });

  // Update slider display value on input
  blurAmountSlider.addEventListener('input', function() {
    blurValueSpan.textContent = blurAmountSlider.value;
  });

  // Add listeners to radio buttons to toggle slider visibility
  blockingMethodRadios.forEach(radio => {
    radio.addEventListener('change', toggleBlurSlider);
  });

  // Save settings when the button is clicked
  saveButton.addEventListener('click', function() {
    let selectedMethod = 'blurred';
    blockingMethodRadios.forEach(radio => {
      if (radio.checked) {
        selectedMethod = radio.value;
      }
    });

    const shouldBlockVods = blockVodsCheckbox.checked;
    const shouldBlockGps = blockGpsCheckbox.checked;
    const blurAmountValue = blurAmountSlider.value;

    chrome.storage.sync.set({
      blockingMethod: selectedMethod,
      blockVods: shouldBlockVods,
      blockGps: shouldBlockGps,
      blurAmount: blurAmountValue // Save blur amount
    }, function() {
       if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError);
            statusDiv.textContent = 'Error saving settings.';
            statusDiv.style.color = 'var(--status-text-error)';
        } else {
            console.log('Settings saved:', { selectedMethod, shouldBlockVods, shouldBlockGps, blurAmountValue });
            statusDiv.textContent = 'Settings saved!';
            statusDiv.style.color = 'var(--status-text-success)';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500); // Clear status after a bit
            // Optional: send a message to the content script to update immediately
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                 if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated"}, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log("Could not send message to content script. It might not be injected or page is protected.", chrome.runtime.lastError);
                        } else {
                            console.log("Sent settings update message to content script.");
                        }
                    });
                } else {
                     console.log("Could not query active tab to send message.");
                }
            });
        }
    });
  });
}); 