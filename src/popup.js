let isEnabled = false;

document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('toggleButton');

  // Load the saved state from storage
  chrome.storage.local.get(['isEnabled'], function (result) {
    isEnabled = result.isEnabled || false;
    button.textContent = isEnabled ? 'Disable' : 'Enable';
  });

  // Check if we're on YouTube
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const url = tabs[0].url;
    if (!url || !url.includes('youtube.com/watch')) {
      button.disabled = true;
      return;
    }
  });

  // Toggle button click event
  button.addEventListener('click', function () {
    isEnabled = !isEnabled;
    this.textContent = isEnabled ? 'Disable' : 'Enable';

    // Save the state to storage
    chrome.storage.local.set({ isEnabled: isEnabled }, function () {
      console.log('State saved:', isEnabled);
    });

    // Send a message to the content script to toggle the button
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleYankButton', shouldShow: isEnabled })
        .then(() => console.log('Message sent successfully'))
        .catch((error) => console.error('Error sending message:', error));
    });
  });
});