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
    white-space: pre-wrap; /* Preserve line breaks and spaces */
  `;

  // Add each text block to the container
  textBlocks.forEach((block) => {
    const textElement = document.createElement("span");
    textElement.textContent = block.text + " "; // Add space between words/phrases

    // Calculate font size based on the height of the bounding box
    const boundingBoxHeight = block.bottom - block.top; // Height of the text in the frame
    const fontSize = boundingBoxHeight * scaleY; // Scale the font size to match the video player

    textElement.style.cssText = `
      position: absolute;
      top: ${block.top * scaleY}px;
      left: ${block.left * scaleX}px;
      background: rgba(255, 255, 0, 0.5); /* Highlight color */
      padding: 0; /* Remove padding to avoid affecting size */
      border-radius: 4px;
      font-size: ${fontSize}px; /* Set font size dynamically */
      line-height: 1; /* Prevent extra spacing */
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

async function performOCR(imageDataUrl) {
  try {
    const text = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "startOCR", image: imageDataUrl },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });

    console.log("Content OCR response:", text);

    if (!text || !text.data || !text.data.words) {
      throw new Error("Invalid OCR response: 'data.words' not found");
    }

    // Group words into lines
    const textBlocks = [];
    let currentLine = { text: "", top: 0, left: 0, bottom: 0, right: 0 };
    text.data.words.forEach((word, index) => {
      const bbox = word.bbox;
      const wordBlock = {
        text: word.text,
        top: bbox.y0,
        left: bbox.x0,
        bottom: bbox.y1,
        right: bbox.x1
      };

      if (index === 0) {
        currentLine = { ...wordBlock };
      } else {
        // Check if the word is on the same line (similar y0 values)
        const yDiff = Math.abs(wordBlock.top - currentLine.top);
        if (yDiff < 10) { // Adjust threshold as needed
          currentLine.text += " " + wordBlock.text;
          currentLine.left = Math.min(currentLine.left, wordBlock.left);
          currentLine.right = Math.max(currentLine.right, wordBlock.right);
          currentLine.top = Math.min(currentLine.top, wordBlock.top);
          currentLine.bottom = Math.max(currentLine.bottom, wordBlock.bottom);
        } else {
          textBlocks.push({ ...currentLine });
          currentLine = { ...wordBlock };
        }
      }
    });
    if (currentLine.text) {
      textBlocks.push(currentLine);
    }

    console.log("Tesseract text blocks:", textBlocks);
    return textBlocks;
  } catch (error) {
    console.error("OCR error:", error);
    throw error;
  }
}


function toggleYankButton(shouldShow) {
  console.log("Toggle Yank Button called with:", shouldShow);

  // Remove any existing toggle button
  const existingButton = document.getElementById("yank-toggle");
  if (existingButton) {
    existingButton.remove();
  }

  // Remove the overlay if it exists and shouldShow is false
  const existingOverlay = document.getElementById("yank-text-overlay");
  if (!shouldShow && existingOverlay) {
    existingOverlay.remove();
    return;
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

    button.onclick = async function (e) {
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

      
        await performOCR(imageDataUrl)
          .then((textBlocks) => {
            console.log("Recognized text blocks:", textBlocks);

            // Display the recognized text on the video player
            createTextOverlay(textBlocks, videoContainer, canvas.width, canvas.height);
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