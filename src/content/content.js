// Function to toggle the Yank button
function toggleYankButton(shouldShow) {
    // Save the button's visibility state in localStorage
    localStorage.setItem("yankButtonShouldShow", shouldShow);
  
    // Remove any existing buttons first
    const existingButton = document.getElementById("yank-toggle");
    if (existingButton) {
      existingButton.remove();
    }
  
    // Check if we're on a YouTube video page
    const video = document.querySelector(".html5-video-player");
    if (!video) {
      console.log("No video player found");
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
  
      // Load the saved button state from localStorage
      const savedState = localStorage.getItem("yankButtonState");
      button.textContent = savedState || "ON";
      button.style.background = savedState === "ON" ? "#2196F3" : "#666";
  
      // Add hover effect
      button.onmouseenter = () => (button.style.opacity = "1");
      button.onmouseleave = () => (button.style.opacity = "0.8");
  
      // Toggle functionality
      button.onclick = function (e) {
        e.stopPropagation(); // Prevent video player from capturing click
        const isOn = this.textContent === "ON";
        this.textContent = isOn ? "OFF" : "ON";
        this.style.background = isOn ? "#666" : "#2196F3";
  
        // Save the button state to localStorage
        localStorage.setItem("yankButtonState", this.textContent);
      };
  
      // Add button to video container
      const videoContainer = document.querySelector(".html5-video-player");
      videoContainer.appendChild(button);
  
      // Make sure button stays visible when video is fullscreen
      button.style.cssText += `
        .html5-video-player[data-fullscreen="true"] #yank-toggle {
          z-index: 2147483647;
        }
      `;
    }
  }
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleYankButton") {
      toggleYankButton(request.shouldShow);
    }
  });
  
  // On page load, check localStorage to see if the button should be shown
  window.addEventListener("load", () => {
    const shouldShow = localStorage.getItem("yankButtonShouldShow") === "true";
    if (shouldShow) {
      toggleYankButton(true);
    }
  });