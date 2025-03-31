// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');
  const blockingMethodRadios = document.querySelectorAll('input[name="blockingMethod"]');
  const blockVodsCheckbox = document.getElementById('blockVods');
  const blockGpsCheckbox = document.getElementById('blockGps');

  // Load saved settings when the popup opens
  chrome.storage.sync.get(['blockingMethod', 'blockVods', 'blockGps'], function(items) {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        statusDiv.textContent = 'Error loading settings.';
        statusDiv.style.color = 'red';
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

    chrome.storage.sync.set({
      blockingMethod: selectedMethod,
      blockVods: shouldBlockVods,
      blockGps: shouldBlockGps
    }, function() {
       if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError);
            statusDiv.textContent = 'Error saving settings.';
            statusDiv.style.color = 'red';
        } else {
            console.log('Settings saved:', { selectedMethod, shouldBlockVods, shouldBlockGps });
            statusDiv.textContent = 'Settings saved!';
            statusDiv.style.color = 'green';
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