console.log("Content script loaded");

function toggleYankButton(shouldShow) {
  console.log("Toggle Yank Button called with:", shouldShow);
  const existingButton = document.getElementById("yank-toggle");
  if (existingButton) {
    existingButton.remove();
  }

  const videoContainer = document.querySelector(".html5-video-player");
  if (!videoContainer) {
    console.log("No video player found");
    return;
  }

  const video = document.querySelector("video");
  if (!video) {
    console.log("No video element found");
    return;
  }

  if (shouldShow) {
    const button = document.createElement("button");
    button.id = "yank-toggle";
    button.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 2000;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 12px;
      font-family: Arial, sans-serif;
      transition: all 0.3s ease;
      opacity: 0.8;
    `;
    button.textContent = "ON";
    button.style.background = "#2196F3";

    button.onmouseenter = () => (button.style.opacity = "1");
    button.onmouseleave = () => (button.style.opacity = "0.8");

    button.onclick = function (e) {
      e.stopPropagation();
      const isOn = this.textContent === "ON";
      this.textContent = isOn ? "OFF" : "ON";
      this.style.background = isOn ? "#666" : "#2196F3";
      localStorage.setItem("yankButtonState", this.textContent);

      if (isOn) {
        console.log("This is ON");
      }
    };

    videoContainer.appendChild(button);
    button.style.display = video.paused ? "inline-block" : "none";

    video.addEventListener("pause", () => {
      button.style.display = "inline-block";
    });
    video.addEventListener("play", () => {
      button.style.display = "none";
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "toggleYankButton") {
    toggleYankButton(request.shouldShow);
  }
});

window.addEventListener("load", () => {
  chrome.storage.local.get(['isEnabled'], function (result) {
    const shouldShow = result.isEnabled || false;
    toggleYankButton(shouldShow);
  });
});