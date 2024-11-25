console.log("starting extension...");
ii(0);

// Initialize the MutationObserver to handle dynamic content
const observer = new MutationObserver(() => {
    // Call the function to check URL and refresh when needed
    handleUrlChange();
});

// Start observing the body for changes to dynamically update the page
observer.observe(document.body, {
    childList: true,    // Watch for additions/removals of child nodes
    subtree: true       // Watch within the entire document
});

// Ensure the `ii()` function is triggered on SPA navigation and page load
if (document.readyState === "complete") {
    ii(0);  // If already loaded, immediately execute
} else {
    window.addEventListener("load", () => ii(0));  // Trigger on initial page load
}

// Listen for internal SPA navigation (URL changes without a full page reload)
window.addEventListener("popstate", () => {
    console.log("popstate detected");
    handleUrlChange();
});

// Override `pushState` to detect SPA navigations
const originalPushState = history.pushState;
history.pushState = function () {
    originalPushState.apply(history, arguments);
    console.log("pushState detected");
    handleUrlChange();
};

// Override `replaceState` to detect SPA navigations
const originalReplaceState = history.replaceState;
history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    console.log("replaceState detected");
    handleUrlChange();
};

// This function checks the current URL and triggers the refresh process if it matches
function handleUrlChange() {
    // Match user profile pages, both /osu and /<gamemode> (taiko, mania, fruits, etc)
    const regex = /\/users\/\d+(\/osu|\/taiko|\/mania|\/fruits)?$/;
    if (regex.test(window.location.pathname)) {
        console.log("URL matches user profile page, refreshing...");
        ii(0);  // Trigger the ii function to refresh the data
    }
}

// The main function to execute the logic for the profile page
function ii(additionalPlaytimeHours) {
    console.log("executing...");

    // Wait for the necessary elements to be available, then execute logic
    waitForElements('.value-display__label', function () {
        let pp = 0;
        let playtime = additionalPlaytimeHours;

        // Find the pp and playtime elements on the page
        const labels = document.querySelectorAll('.value-display__label');
        labels.forEach(label => {
            // Searches for 'pp', then gets playtime by sibling element
            if (label.textContent.trim() === 'pp') {
                const ppElement = label.nextElementSibling.querySelector('.value-display__value div');
                const playtimeElement = ppElement.parentElement.parentElement.nextElementSibling.querySelector('.value-display__value span');

                console.log("playtimeelement:", playtimeElement);
                playtime += parseInt(playtimeElement.getAttribute('title').split(' ')[0].replace(',', ''));
                console.log("line 27 playtime:", playtime);
                pp = parseInt(ppElement.textContent.replace(/[,.]/g, ''));
            }
        });

        // Compute expected playtime and ii
        let expectedPlaytime = 0.0183 * Math.pow(pp, 1.2);
        let iiValue = expectedPlaytime / playtime;

        // Insert ii value on the page
        updateElementStyles();
        updateElementGap('8px');

        const parentElement = document.querySelector('.profile-detail__values--grid');
        const iiElementAlreadyExists = document.getElementById('iiElement');

        if (iiElementAlreadyExists) {
            iiElementAlreadyExists.remove();
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
    });
}

// Wait for elements to load and call the callback when found
function waitForElements(selector, callback) {
    if (document.querySelectorAll(selector).length > 0) {
        callback();  // If the elements are already available, run the callback
    } else {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelectorAll(selector).length > 0) {
                callback();  // Run the callback when the elements are available
                obs.disconnect();  // Stop observing once found
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
        // Searches for pp, then gets playtime by sibling (bc pp is same in every language)
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

// Update the grid template columns for the profile details
function updateElementStyles() {
    const elements = document.querySelectorAll('.profile-detail__values--grid');
    elements.forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
}

// Update the gap for profile detail values
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
