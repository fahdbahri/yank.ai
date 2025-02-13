let isEnabled = false;

document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('toggleButton');
  const message = document.getElementById('message');

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
      message.textContent = 'Please go to a YouTube video page to use this extension';
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
      sendMessageWithRetry(tabs[0].id, { action: 'toggleYankButton', shouldShow: isEnabled })
        .then(() => console.log('Message sent successfully'))
        .catch((error) => console.error('Error sending message:', error));
    });
  });
});

function sendMessageWithRetry(tabId, message, retries = 3, delay = 500) {
  return new Promise((resolve, reject) => {
    const send = () => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          if (retries > 0) {
            retries--;
            setTimeout(send, delay);
          } else {
            reject(new Error('Could not establish connection. Receiving end does not exist.'));
          }
        } else {
          resolve(response);
        }
      });
    };
    send();
  });
}