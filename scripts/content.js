console.log("starting extension...");
ii(0);

// Handle initial page load
if (document.readyState === "complete") {
    // If the page is already loaded, run the logic immediately
    ii(0);
} else {
    // Otherwise, wait for the page to finish loading
    window.addEventListener("load", () => ii(0));
}

// Listen for SPA navigation events (URL changes without full page reload)
window.addEventListener("popstate", () => {
    console.log("popstate detected");
    // Re-run the function on URL change
    handleUrlChange();
});

// Listen for URL changes through pushState (used by SPAs)
const originalPushState = history.pushState;
history.pushState = function () {
    originalPushState.apply(history, arguments);
    console.log("pushState detected");
    handleUrlChange();
};

// Listen for URL changes through replaceState (used by SPAs)
const originalReplaceState = history.replaceState;
history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    console.log("replaceState detected");
    handleUrlChange();
};

// This function checks the URL and triggers the refresh
function handleUrlChange() {
    // Check if the new URL matches the user page pattern
    const regex = /\/users\/\d+(\/osu)?$/;
    if (regex.test(window.location.pathname)) {
        ii(0);  // Re-run the ii function when the URL matches
    }
}

// Observe changes in the page content for dynamic updates
const observer = new MutationObserver(() => {
    handleUrlChange(); // Run handleUrlChange when DOM changes
});

// Start observing body element for changes in the URL
observer.observe(document.body, {
    childList: true,  // Watch for additions/removals of child nodes
    subtree: true      // Watch within the entire body
});

window.navigation.addEventListener("navigate", (event) => {
    console.log("navigate detected");
    // Matches /users/<id>/osu though the /osu is optional and other gamemodes (taiko, mania, fruits) won't match
    const regex = /\/users\/\d+(\/osu)?$/;
    if (regex.test(event.destination.url)) ii(0);
});

function ii(additionalPlaytimeHours) {
    console.log("executing...");
    waitForElements('.value-display__label', function () {
        let pp = 0;
        let playtime = additionalPlaytimeHours;

        const labels = document.querySelectorAll('.value-display__label');
        labels.forEach(label => {
            // Searches for pp, then gets playtime by sibling (because pp is the same in every language)
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

        // Insert ii on website
        updateElementStyles();
        updateElementGap('8px');

        const parentElement = document.querySelector('.profile-detail__values--grid');
        const iiElementAlreadyExists = document.getElementById('iiElement');

        if (iiElementAlreadyExists) {
            iiElementAlreadyExists.remove();
            console.log('Element with ID "iiElement" has been removed.');
        }

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

function waitForElements(selector, callback) {
    // Check if the elements are already available, if yes, run the callback
    if (document.querySelectorAll(selector).length > 0) {
        callback();
    } else {
        // Use MutationObserver to watch for elements being added to the DOM
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelectorAll(selector).length > 0) {
                callback();
                obs.disconnect(); // Stop observing once the elements are found
            }
        });
        observer.observe(document.body, {
            childList: true, // Watch for additions/removals of child nodes
            subtree: true     // Watch within the entire body
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

    // Calculate predicted playtime
    return playtime * Math.pow(goalpp / pp, 1.2);
}

// Function to update grid-template-columns for elements with the class
function updateElementStyles() {
    const elements = document.querySelectorAll('.profile-detail__values--grid');
    elements.forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
}

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
