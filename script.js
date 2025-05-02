// ========================
// State Management
// ========================
let segments = [];
let currentIndex = 0;
let startTime;
let timerInterval;
let showElapsed = false;
let wasFullscreenActivated = false;
let endingMessage = "Yay! All done";
let addSegmentBtnEditText = "Add Segment";
let addSegmentBtnSaveText = "Save Changes";
let showElapsedText = "Show Elapsed";
let showRemainingText = "Show Remaining";

const appState = {
    draggedIndex: null,
    isEditing: false,
    editingIndex: null,
};

// ========================
// DOM Elements
// ========================
const timeDisplay = document.getElementById("timeDisplay");
const labelDisplay = document.getElementById("labelDisplay");
const messageDisplay = document.getElementById("messageDisplay");
const segmentList = document.getElementById("segmentList");
const addSegmentBtn = document.getElementById("addSegmentBtn");

// ========================
// Event Listeners
// ========================
addSegmentBtn.addEventListener("click", handleAddOrEditSegment);
document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("toggleModeBtn").addEventListener("click", toggleMode);

// ========================
// Initialization on Load
// ========================
function initializeDefaults() {
    const computedStyles = window.getComputedStyle(document.body);
    const timeComputedStyles = window.getComputedStyle(timeDisplay);
    const labelComputedStyles = window.getComputedStyle(labelDisplay);
    const messageComputedStyles = window.getComputedStyle(messageDisplay);

    // Set default colors (convert rgb to hex)
    document.getElementById("backgroundColorPicker").value = rgbToHex(computedStyles.backgroundColor) || "#ffeef8";
    document.getElementById("timeColorPicker").value = rgbToHex(timeComputedStyles.color) || "#333333";
    document.getElementById("labelColorPicker").value = rgbToHex(labelComputedStyles.color) || "#333333";
    document.getElementById("messageColorPicker").value = rgbToHex(messageComputedStyles.color) || "#666666";

    // Set default sizes
    document.getElementById("timeSizeSlider").value = parseInt(timeComputedStyles.fontSize, 10) || 80;
    document.getElementById("labelSizeSlider").value = parseInt(labelComputedStyles.fontSize, 10) || 36;
    document.getElementById("messageSizeSlider").value = parseInt(messageComputedStyles.fontSize, 10) || 24;
}

// Helper function to convert rgb() to hex
function rgbToHex(rgb) {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb; // Return the original value if it's not in rgb() format
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
}

// Call the initialization function when the page loads
window.addEventListener("DOMContentLoaded", initializeDefaults);

// ========================
// Segment Management
// ========================
function handleAddOrEditSegment() {
    const timeStr = document.getElementById("timeInput").value;
    const label = document.getElementById("labelInput").value.trim();
    const message = document.getElementById("messageInput").value.trim();

    if (!timeStr || timeStr === "00:00:00") {
        alert("Please enter a valid time greater than 00:00:00.");
        return;
    }
    if (!label) {
        alert("Label cannot be empty.");
        return;
    }

    const [h, m, s] = timeStr.split(":").map(Number);
    const totalSeconds = h * 3600 + m * 60 + s;

    if (totalSeconds <= 0) {
        alert("Please enter a valid time greater than 00:00:00.");
        return;
    }

    if (appState.isEditing) {
        segments[appState.editingIndex] = { duration: totalSeconds, label, message };
        appState.isEditing = false;
        appState.editingIndex = null;
        addSegmentBtn.textContent = "Add Segment";
    } else {
        segments.push({ duration: totalSeconds, label, message });
    }

    renderSegmentList();
    resetInputFields();
}

function editSegment(index) {
    const seg = segments[index];

    document.getElementById("timeInput").value = formatTime(seg.duration);
    document.getElementById("labelInput").value = seg.label;
    document.getElementById("messageInput").value = seg.message;

    appState.isEditing = true;
    appState.editingIndex = index;
    addSegmentBtn.textContent = addSegmentBtnSaveText;
}

function deleteSegment(index) {
    segments.splice(index, 1);
    renderSegmentList();
    resetInputFields();
    appState.isEditing = false;
    appState.editingIndex = null;
    addSegmentBtn.textContent = addSegmentBtnEditText;

    // Stop the timer if no segments are left
    if (segments.length === 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        resetDisplay();
    }
}

// ========================
// Color and Size Customization
// ========================
document.getElementById("backgroundColorPicker").addEventListener("input", (event) => {
    const backgroundColor = event.target.value;
    document.documentElement.style.setProperty("--background-color", backgroundColor);

    // Dynamically adjust colors for contrast
    const isLightBackground = isLightColor(backgroundColor);

    // Update controls colors
    const controlsBg = isLightBackground ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.7)";
    const controlsBorder = isLightBackground ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.3)";
    document.documentElement.style.setProperty("--controls-bg", controlsBg);
    document.documentElement.style.setProperty("--controls-border", controlsBorder);

    // Update segment list colors
    const segmentBg = isLightBackground ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.7)";
    const segmentBorder = isLightBackground ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.3)";
    document.documentElement.style.setProperty("--segment-bg", segmentBg);
    document.documentElement.style.setProperty("--segment-border", segmentBorder);

    // Update display colors
    const displayBg = event.target.value;
    const displayTextColor = isLightBackground ? "#fff" : "#333";
    document.documentElement.style.setProperty("--display-bg", displayBg);
    document.documentElement.style.setProperty("--display-text-color", displayTextColor);

    // Update button colors
    const buttonBg = isLightBackground ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.8)";
    const buttonHoverBg = isLightBackground ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.9)";
    const buttonTextColor = isLightBackground ? "#fff" : "#333";
    document.documentElement.style.setProperty("--button-bg", buttonBg);
    document.documentElement.style.setProperty("--button-hover-bg", buttonHoverBg);
    document.documentElement.style.setProperty("--button-text-color", buttonTextColor);
});

// Helper function to determine if a color is light or dark
function isLightColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 155; // Threshold for light/dark
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

document.getElementById("timeColorPicker").addEventListener("input", (event) => {
    timeDisplay.style.color = event.target.value;
});

document.getElementById("labelColorPicker").addEventListener("input", (event) => {
    labelDisplay.style.color = event.target.value;
});

document.getElementById("messageColorPicker").addEventListener("input", (event) => {
    messageDisplay.style.color = event.target.value;
});

document.getElementById("timeSizeSlider").addEventListener("input", (event) => {
    timeDisplay.style.fontSize = `${event.target.value}px`;
});

document.getElementById("labelSizeSlider").addEventListener("input", (event) => {
    labelDisplay.style.fontSize = `${event.target.value}px`;
});

document.getElementById("messageSizeSlider").addEventListener("input", (event) => {
    messageDisplay.style.fontSize = `${event.target.value}px`;
});

function toggleFullscreen() {
    const display = document.getElementById("display");
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (!isFullscreen) {
        if (display.requestFullscreen) {
            display.requestFullscreen();
        } else if (display.webkitRequestFullscreen) {
            display.webkitRequestFullscreen();
        }
        document.body.classList.add("fullscreen-mode");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.body.classList.remove("fullscreen-mode");
    }
}

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove("fullscreen-mode");
        wasFullscreenActivated = false;
    }
});

// ========================
// Timer Logic
// ========================
function startTimer() {
    if (segments.length === 0) {
        alert("Add at least one segment!");
        return;
    }

    if (timerInterval) {
        alert("Timer is already running!");
        return;
    }

    endingMessage = document.getElementById("endingMessageInput").value.trim() || endingMessage;
    currentIndex = 0;
    startSegment(currentIndex);
}

function startSegment(index) {
    if (index >= segments.length) {
        clearInterval(timerInterval);
        timerInterval = null;
        resetDisplay();
        labelDisplay.textContent = endingMessage;
        messageDisplay.textContent = "";

        if (wasFullscreenActivated) {
            toggleFullscreen();
            wasFullscreenActivated = false;
        }

        return;
    }

    const seg = segments[index];
    startTime = new Date();

    labelDisplay.textContent = seg.label;
    messageDisplay.textContent = seg.message;

    // 🖥️ Go fullscreen only at the first segment!
    if (index === 0 && !(document.fullscreenElement || document.webkitFullscreenElement)) {
        toggleFullscreen();
        wasFullscreenActivated = true;
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(() => updateSegment(seg), 200);
}

function updateSegment(seg) {
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = seg.duration - elapsed;
    const display = showElapsed ? elapsed : remaining;

    if (remaining < 0) {
        currentIndex++;
        startSegment(currentIndex);
        return;
    }

    timeDisplay.textContent = formatTime(display);
}

function toggleMode() {
    showElapsed = !showElapsed;
    document.getElementById("toggleModeBtn").textContent = showElapsed ? showRemainingText : showElapsedText;
}

// ========================
// Rendering Logic
// ========================
function renderSegmentList() {
    segmentList.innerHTML = "";
    segments.forEach((seg, index) => {
        const el = document.createElement("div");
        el.className = "segment-item";
        el.draggable = true; // Make the segment draggable
        el.dataset.index = index; // Store the index for reference

        el.innerHTML = `
            <b>Segment ${index + 1}</b>
            <div>Time: ${formatTime(seg.duration)}</div>
            <div>Label: ${seg.label}</div>
            <div>Message: ${seg.message}</div>
        `;

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editSegment(index));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteSegment(index));

        el.appendChild(editBtn);
        el.appendChild(deleteBtn);

        // Add drag-and-drop event listeners
        el.addEventListener("dragstart", handleDragStart);
        el.addEventListener("dragover", handleDragOver);
        el.addEventListener("drop", handleDrop);

        segmentList.appendChild(el);
    });
}

// ========================
// Drag-and-Drop Logic
// ========================
function handleDragStart(event) {
    const target = event.target.closest(".segment-item");
    if (target) {
        appState.draggedIndex = target.dataset.index;
        target.classList.add("dragging");
    }
}

function handleDragOver(event) {
    event.preventDefault();
    const target = event.target.closest(".segment-item");
    if (target) {
        target.classList.add("drag-over");
    }
}

function handleDrop(event) {
    event.preventDefault();
    const target = event.target.closest(".segment-item");
    if (target && appState.draggedIndex !== null) {
        const droppedIndex = target.dataset.index;
        reorderSegments(appState.draggedIndex, droppedIndex);
    }
    clearDragStyles();
}

function clearDragStyles() {
    document.querySelectorAll(".dragging, .drag-over").forEach(el => {
        el.classList.remove("dragging", "drag-over");
    });
}

function reorderSegments(fromIndex, toIndex) {
    try {
        fromIndex = parseInt(fromIndex);
        toIndex = parseInt(toIndex);

        if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= segments.length || toIndex >= segments.length) {
            throw new Error("Invalid indices for reordering.");
        }

        const [movedSegment] = segments.splice(fromIndex, 1);
        segments.splice(toIndex, 0, movedSegment);

        renderSegmentList();
    } catch (error) {
        console.error("Error reordering segments:", error.message);
    }
}

// ========================
// Utility Functions
// ========================
function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

function resetInputFields() {
    document.getElementById("timeInput").value = "01:00:00";
    document.getElementById("labelInput").value = "";
    document.getElementById("messageInput").value = "";
}

function resetDisplay() {
    timeDisplay.textContent = "00:00:00";
    labelDisplay.textContent = "Label";
    messageDisplay.textContent = "Message";
}
