console.log("Content script loaded");

function createTextOverlay(textBlocks, videoPlayer, frameWidth, frameHeight) {
  // Remove any existing overlay
  const existingOverlay = document.getElementById("yank-text-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Get the video player's dimensions
  const playerRect = videoPlayer.getBoundingClientRect();
  const playerWidth = playerRect.width;
  const playerHeight = playerRect.height;

  // Calculate scaling factors
  const scaleX = playerWidth / frameWidth;
  const scaleY = playerHeight / frameHeight;

  // Create a new overlay container
  const overlay = document.createElement("div");
  overlay.id = "yank-text-overlay";
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Allow clicks to pass through */
    z-index: 4000;
    overflow: hidden;
  `;

  // Create a single container for all recognized text
  const textContainer = document.createElement("div");
  textContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: auto; /* Enable text selection */
    user-select: text; /* Allow default text selection */
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: black;
    white-space: pre-wrap; /* Preserve line breaks and spaces */
  `;

  // Add each text block to the container
  textBlocks.forEach((block) => {
    const textElement = document.createElement("span");
    textElement.textContent = block.text + " "; // Add space between words/phrases
    textElement.style.cssText = `
      position: absolute;
      top: ${block.top * scaleY}px;
      left: ${block.left * scaleX}px;
      background: rgba(255, 255, 0, 0.5); /* Highlight color */
      padding: 2px 4px;
      border-radius: 4px;
    `;
    textContainer.appendChild(textElement);
  });

  // Append the text container to the overlay
  overlay.appendChild(textContainer);

  // Append the overlay to the video container
  videoPlayer.appendChild(overlay);

  // Ensure the toggle button remains interactive
  const toggleButton = document.getElementById("yank-toggle");
  if (toggleButton) {
    toggleButton.style.pointerEvents = "auto";
  }
}

function captureVideoFrame(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png"); // Convert frame to data URL
}

async function recognizeTextWithGoogleVision(imageDataUrl) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageDataUrl.split(",")[1] }, // Base64-encoded image
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );
  const result = await response.json();
  const textAnnotations = result.responses[0]?.textAnnotations || [];
  if (!textAnnotations.length) {
    throw new Error("No text detected");
  }

  // Extract text blocks with bounding box information
  const textBlocks = textAnnotations.slice(1).map((annotation) => {
    const vertices = annotation.boundingPoly.vertices;
    return {
      text: annotation.description,
      top: vertices[0].y || 0,
      left: vertices[0].x || 0,
    };
  });
  return textBlocks;
}

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
      z-index: 5000; /* Higher than the overlay */
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
      pointer-events: auto; /* Ensure the button is interactive */
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

        // Capture the current video frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png"); // Convert frame to data URL

        console.log("Sending imageDataUrl:", imageDataUrl);

        // Send the image to Google Cloud Vision API for OCR
        recognizeTextWithGoogleVision(imageDataUrl)
          .then((textBlocks) => {
            console.log("Recognized text blocks:", textBlocks);

            // Display the recognized text on the video player
            const videoPlayer = document.querySelector(".html5-video-player");
            if (videoPlayer) {
              createTextOverlay(textBlocks, videoPlayer, canvas.width, canvas.height);
            }
          })
          .catch((error) => {
            console.error("OCR error:", error);
          });
      } else {
        // Remove the overlay when toggling off
        const overlay = document.getElementById("yank-text-overlay");
        if (overlay) {
          overlay.remove();
        }
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
  chrome.storage.local.get(["isEnabled"], function (result) {
    const shouldShow = result.isEnabled || false;
    toggleYankButton(shouldShow);
  });
});