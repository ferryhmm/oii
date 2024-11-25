console.log("starting extension...");
let isExecuting = false;  // Flag to track if the function is already running
let observer;  // MutationObserver for detecting SPA navigation

function startObserver() {
    observer = new MutationObserver(() => handleUrlChange());  // Trigger on DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
    observer && observer.disconnect();  // Stop observing
}

// Check if the current URL matches the user profile page
function handleUrlChange() {
    if (/\/users\/\d+(\/osu|\/taiko|\/mania|\/fruits)?$/.test(window.location.pathname)) {
        ii(0);  // Trigger the ii function for user profile page
    }
}

// Trigger function when page is loaded or SPA navigation happens
if (document.readyState === "complete") {
    ii(0);
} else {
    window.addEventListener("load", () => ii(0));
}

window.addEventListener("popstate", handleUrlChange);  // Detect browser navigation
const pushStateOrig = history.pushState;
history.pushState = function () { pushStateOrig.apply(history, arguments); handleUrlChange(); };  // Override pushState
const replaceStateOrig = history.replaceState;
history.replaceState = function () { replaceStateOrig.apply(history, arguments); handleUrlChange(); };  // Override replaceState

// Main function to handle profile data and calculate 'ii' value
function ii(additionalPlaytimeHours) {
    if (isExecuting) return;
    isExecuting = true;

    waitForElements('.value-display__label', () => {
        let pp = 0, playtime = additionalPlaytimeHours;
        document.querySelectorAll('.value-display__label').forEach(label => {
            if (label.textContent.trim() === 'pp') {
                const ppElement = label.nextElementSibling.querySelector('.value-display__value div');
                const playtimeElement = ppElement.parentElement.parentElement.nextElementSibling.querySelector('.value-display__value span');
                playtime += parseInt(playtimeElement.getAttribute('title').split(' ')[0].replace(',', ''));
                pp = parseInt(ppElement.textContent.replace(/[,.]/g, ''));
            }
        });

        const expectedPlaytime = 0.0183 * Math.pow(pp, 1.2);
        const iiValue = expectedPlaytime / playtime;
        updatePage(iiValue);

        setTimeout(() => isExecuting = false, 3000);  // Delay before allowing next execution
    });
}

// Wait for required elements to be present on the page
function waitForElements(selector, callback) {
    if (document.querySelectorAll(selector).length) {
        callback();
    } else {
        const observer = new MutationObserver(() => {
            if (document.querySelectorAll(selector).length) {
                callback();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Update the page with the calculated 'ii' value
function updatePage(iiValue) {
    updateElementStyles();
    const parentElement = document.querySelector('.profile-detail__values--grid');
    const iiElement = document.getElementById('iiElement');
    if (iiElement) iiElement.remove();

    const outerDiv = document.createElement('div');
    outerDiv.className = 'value-display value-display--plain';
    outerDiv.id = 'iiElement';
    outerDiv.innerHTML = `<div class="value-display__label">ii</div><div class="value-display__value">${iiValue.toFixed(2)}x</div>`;
    parentElement.appendChild(outerDiv);
}

// Update grid styles and gap
function updateElementStyles() {
    document.querySelectorAll('.profile-detail__values--grid').forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
    document.querySelectorAll('.profile-detail__values').forEach(element => {
        element.style.gap = '8px';
    });
}

// Predict future playtime based on goal PP
function predictFuture(goalpp) {
    let pp = 0, playtime = 0;
    document.querySelectorAll('.value-display__label').forEach(label => {
        if (label.textContent.trim() === 'pp') {
            const ppElement = label.nextElementSibling.querySelector('.value-display__value div');
            const playtimeElement = ppElement.parentElement.parentElement.nextElementSibling.querySelector('.value-display__value span');
            playtime += parseInt(playtimeElement.getAttribute('title').split(' ')[0].replace(',', ''));
            pp = parseInt(ppElement.textContent.replace(/[,.]/g, ''));
        }
    });
    return playtime * Math.pow(goalpp / pp, 1.2);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.additionalPlaytimeHours) {
        ii(Number(request.additionalPlaytimeHours));
        sendResponse(request);
    }
    if (request.goalpp) {
        sendResponse(predictFuture(Number(request.goalpp)));
    }
});
