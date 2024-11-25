console.log("starting extension...");
let isExecuting = false;  // Flag to track if the function is already running
let observer;  // MutationObserver to detect changes in the DOM (for SPA)

function startObserver() {
    // Start observing changes to the DOM (e.g., after a page change in SPA)
    observer = new MutationObserver(() => {
        // Re-trigger the URL change handler on every DOM mutation
        handleUrlChange();
    });

    // Observe the body for changes (SPA navigation could modify the DOM)
    observer.observe(document.body, {
        childList: true,    // Watch for additions/removals of child nodes
        subtree: true       // Observe entire document body
    });
}

function stopObserver() {
    if (observer) {
        observer.disconnect();
        console.log("MutationObserver stopped.");
    }
}

// This function checks if the current URL is a user profile page
function handleUrlChange() {
    // Regex to match URLs for osu! user profiles (including gamemode subpages)
    const regex = /\/users\/\d+(\/osu|\/taiko|\/mania|\/fruits)?$/;
    if (regex.test(window.location.pathname)) {
        console.log("URL matches user profile page, refreshing...");
        ii(0);  // Trigger the ii function to refresh the data
    }
}

// Trigger function when page is loaded
if (document.readyState === "complete") {
    ii(0);  // If the page is fully loaded, immediately execute ii
} else {
    window.addEventListener("load", () => ii(0));  // Trigger on initial page load
}

// Handle browser back/forward buttons (SPA navigation)
window.addEventListener("popstate", () => {
    console.log("popstate detected");
    handleUrlChange();  // Recheck URL after a browser navigation event
});

// Override `pushState` and `replaceState` to capture SPA navigation
const originalPushState = history.pushState;
history.pushState = function () {
    originalPushState.apply(history, arguments);
    console.log("pushState detected");
    handleUrlChange();  // Recheck URL after changing history state
};

const originalReplaceState = history.replaceState;
history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    console.log("replaceState detected");
    handleUrlChange();  // Recheck URL after replacing history state
};

// The main function to handle logic on the user profile page
function ii(additionalPlaytimeHours) {
    if (isExecuting) return;  // Prevent execution if already running
    isExecuting = true;  // Set flag to prevent duplicate execution

    console.log("executing...");

    // Wait for elements to be available on the page
    waitForElements('.value-display__label', function () {
        let pp = 0;
        let playtime = additionalPlaytimeHours;

        // Iterate over the page labels to find 'pp' and 'playtime'
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

        // Compute expected playtime and ii value
        let expectedPlaytime = 0.0183 * Math.pow(pp, 1.2);
        let iiValue = expectedPlaytime / playtime;

        // Insert ii value on the page
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

        // Reset the execution flag after a delay to avoid re-execution
        setTimeout(() => {
            isExecuting = false;  // Allow the function to run again after 3 seconds
        }, 3000);  // Adjust the delay time as necessary
    });
}

// Wait for elements to appear before executing callback
function waitForElements(selector, callback) {
    if (document.querySelectorAll(selector).length > 0) {
        callback();  // If elements already exist, call the callback immediately
    } else {
        // Use MutationObserver to detect when the required elements are added
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelectorAll(selector).length > 0) {
                callback();  // Execute callback once the elements are found
                obs.disconnect();  // Stop observing after elements are found
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Update the grid layout style to accommodate the new "ii" element
function updateElementStyles() {
    const elements = document.querySelectorAll('.profile-detail__values--grid');
    elements.forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
}

// Adjust the gap between elements for improved layout
function updateElementGap(newGap) {
    const elements = document.querySelectorAll('.profile-detail__values');
    elements.forEach(element => {
        element.style.gap = newGap;
    });
}

// Listen for external messages from the extension
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

// Predict future playtime based on a given goal PP
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

    return playtime * Math.pow(goalpp / pp, 1.2);
}
