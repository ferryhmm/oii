console.log("starting extension...");
let isExecuting = false;  // Flag to track if the function is already running
let observer;  // Observer for detecting changes to the DOM

// This function initializes the MutationObserver to detect SPA navigation
function startObserver() {
    observer = new MutationObserver(() => {
        // Handle the URL change and re-trigger logic for dynamic updates
        handleUrlChange();
    });

    // Observe the body for changes (detects SPA navigation)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Function to stop the MutationObserver when it's no longer needed
function stopObserver() {
    if (observer) {
        observer.disconnect();
        console.log("MutationObserver stopped.");
    }
}

// Function to handle URL change, either on page load or SPA navigation
function handleUrlChange() {
    // Check if the current URL matches the user profile page pattern
    const regex = /\/users\/\d+(\/osu|\/taiko|\/mania|\/fruits)?$/;
    if (regex.test(window.location.pathname)) {
        console.log("URL matches user profile page, refreshing...");
        ii(0);  // Trigger the ii function to refresh the data
    }
}

// Check if the page is already loaded, if yes, trigger ii immediately
if (document.readyState === "complete") {
    ii(0);  // If the page is fully loaded, immediately execute ii
} else {
    window.addEventListener("load", () => ii(0));  // Trigger on initial page load
}

// Listen for popstate events (triggered by navigation in SPAs)
window.addEventListener("popstate", () => {
    console.log("popstate detected");
    handleUrlChange();  // Handle URL change when using browser's back/forward buttons
});

// Override `pushState` to detect URL changes in SPA navigation
const originalPushState = history.pushState;
history.pushState = function () {
    originalPushState.apply(history, arguments);
    console.log("pushState detected");
    handleUrlChange();  // Handle URL change after SPA navigation
};

// Override `replaceState` for SPA navigations (when the URL is updated without reloading)
const originalReplaceState = history.replaceState;
history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    console.log("replaceState detected");
    handleUrlChange();  // Handle URL change after replacing the state
};

// The main function to execute the logic for the profile page
function ii(additionalPlaytimeHours) {
    if (isExecuting) return;  // Prevent execution if already running
    isExecuting = true;  // Set flag to true, indicating the function is running

    console.log("executing...");

    // Wait for necessary elements to be available before proceeding
    waitForElements('.value-display__label', function () {
        let pp = 0;
        let playtime = additionalPlaytimeHours;

        // Find the pp and playtime elements on the page
        const labels = document.querySelectorAll('.value-display__label');
        labels.forEach(label => {
            // Look for the 'pp' label, then get playtime from the sibling element
            if (label.textContent.trim() === 'pp') {
                const ppElement = label.nextElementSibling.querySelector('.value-display__value div');
                const playtimeElement = ppElement.parentElement.parentElement.nextElementSibling.querySelector('.value-display__value span');

                console.log("playtimeelement:", playtimeElement);
                playtime += parseInt(playtimeElement.getAttribute('title').split(' ')[0].replace(',', ''));
                console.log("line 27 playtime:", playtime);
                pp = parseInt(ppElement.textContent.replace(/[,.]/g, ''));
            }
        });

        // Compute expected playtime and ii value
        let expectedPlaytime = 0.0183 * Math.pow(pp, 1.2);
        let iiValue = expectedPlaytime / playtime;

        // Insert the ii value on the page
        updateElementStyles();
        updateElementGap('8px');

        const parentElement = document.querySelector('.profile-detail__values--grid');
        const iiElementAlreadyExists = document.getElementById('iiElement');

        if (iiElementAlreadyExists) {
            iiElementAlreadyExists.remove();  // Remove existing iiElement if present
            console.log('Element with ID "iiElement" has been removed.');
        }

        // Create and insert the new element displaying ii
        const outerDiv = document.createElement('div');
        outerDiv.className = 'value-display value-display--plain';
        outerDiv.id = 'iiElement';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'value-display__label';
        labelDiv.textContent = 'ii';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'value-display__value';
        valueDiv.textContent = iiValue.toFixed(2) + "x";

        outerDiv.appendChild(labelDiv);
        outerDiv.appendChild(valueDiv);

        parentElement.appendChild(outerDiv);

        // Reset the execution flag after a small delay to prevent spamming
        setTimeout(() => {
            isExecuting = false;  // Allow the function to run again after 3 seconds
        }, 3000);  // Adjust the delay (in ms) as needed
    });
}

// Wait for specific elements to load before running the callback
function waitForElements(selector, callback) {
    if (document.querySelectorAll(selector).length > 0) {
        callback();  // If elements are already present, run the callback immediately
    } else {
        // Use MutationObserver to detect when elements are added to the DOM
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelectorAll(selector).length > 0) {
                callback();  // Run the callback when elements are found
                obs.disconnect();  // Stop observing once the elements are available
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

function predictFuture(goalpp) {
    let pp = 0;
    let playtime = 0;

    const labels = document.querySelectorAll('.value-display__label');

    labels.forEach(label => {
        if (label.textContent.trim() === 'pp') {
            const ppElement = label.nextElementSibling.querySelector('.value-display__value div');
            const playtimeElement = ppElement.parentElement.parentElement.nextElementSibling.querySelector('.value-display__value span');

            console.log("playtimeelement:", playtimeElement);
            playtime += parseInt(playtimeElement.getAttribute('title').split(' ')[0].replace(',', ''));
            console.log("line 27 playtime:", playtime);
            pp = parseInt(ppElement.textContent.replace(/[,.]/g, ''));
        }
    });

    // Calculate predicted future playtime based on goal pp
    return playtime * Math.pow(goalpp / pp, 1.2);
}

// Update the grid styles to accommodate the new value element
function updateElementStyles() {
    const elements = document.querySelectorAll('.profile-detail__values--grid');
    elements.forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
}

// Update the gap between elements for better layout
function updateElementGap(newGap) {
    const elements = document.querySelectorAll('.profile-detail__values');
    elements.forEach(element => {
        element.style.gap = newGap;
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
        if (request.additionalPlaytimeHours) {
            ii(Number(request.additionalPlaytimeHours));
            console.log("ii executed with additional playtime");
            sendResponse(request);
        }
        if (request.goalpp) {
            console.log("goalpp requested");
            sendResponse(predictFuture(Number(request.goalpp)));
        }
    }
);
