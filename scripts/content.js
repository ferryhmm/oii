/**
 * @typedef User
 * @property {UserStats} statistics
 */

/**
 * @typedef UserStats
 * @property {number} count_50
 * @property {number} count_100
 * @property {number} count_300
 * @property {number} count_miss
 * @property {number} country_rank
 * @property {number} global_rank
 * @property {Object} grade_counts
 * @property {number} grade_counts.a
 * @property {number} grade_counts.s
 * @property {number} grade_counts.sh
 * @property {number} grade_counts.ss
 * @property {number} grade_counts.ssh
 * @property {number} hit_accuracy
 * @property {boolean} is_ranked
 * @property {Object} level
 * @property {number} level.current
 * @property {number} level.progress
 * @property {number} maximum_combo
 * @property {number} play_count
 * @property {number} play_time
 * @property {number} pp
 * @property {Object} rank
 * @property {number} rank.country
 * @property {number} ranked_score
 * @property {number} replays_watched_by_others
 * @property {number} total_hits
 * @property {number} total_score
 */

/**
 * @typedef UserData
 * @property {string} current_mode - The current mode of the user
 * @property {User} user - The user object
 */

console.log("starting extension...")
ii(0, true);

window.navigation.addEventListener("navigate", (event) => {
    console.log("navigate detected");
    //matches /users/<id>/osu though the /osu is optional and other gamemodes (taiko, mania, fruits) won't match
    const regex = /\/users\/\d+(\/osu)?$/;
    if (regex.test(event.destination.url))
        ii(0);
})

async function ii(additionalPlaytimeHours, newLoad = false) {
    console.log("executing...")

    if (!newLoad) {
        // Use a MutationObserver to wait for the lazy loaded values to get populated
        let waitForData = new Promise((resolve, reject) => {
            var observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                    if (node.querySelectorAll('.js-react--profile-page')) {
                        observer.disconnect();
                        resolve();
                    }
                }));
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
        await waitForData;
    }

    /**
     * @type UserData
     */
    const userData = JSON.parse(document.body.querySelector('.js-react--profile-page').attributes.getNamedItem('data-initial-data').value);

    if (userData.current_mode != 'osu') return;

    const pp = userData.user.statistics.pp;
    const playtime = userData.user.statistics.play_time + additionalPlaytimeHours * 3600;

    // Compute expected playtime and ii, prerework: 1.16e-3 * Math.pow(pp, 1.17) and playtime/24
    const expectedpp = 0.001956 * playtime + 67.209899;
    const ii = pp / expectedpp;

    // Use a MutationObserver to wait for the lazy loaded values to get populated
    let waitForDetails = new Promise((resolve, reject) => {
        // Check if profile values already exist
        if (document.querySelectorAll('div.value-display--plain').length >= 3) {
            resolve();
        } else {
            var observer = new MutationObserver(_ => {
                // Check if profile values div were created
                if (document.querySelectorAll('div.value-display--plain').length >= 3) {
                    // Stop the observer and resolve
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
    await waitForDetails;

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
    valueDiv.textContent = ii.toFixed(2) + "x";

    outerDiv.appendChild(labelDiv);
    outerDiv.appendChild(valueDiv);

    parentElement.appendChild(outerDiv)
}

function predictFuture(goalpp) {
    const userData = JSON.parse(document.body.querySelector('.js-react--profile-page').attributes.getNamedItem('data-initial-data').value)
    const pp = userData.user.statistics.pp;
    const playtime = userData.user.statistics.play_time / 3600;
    //playtime*(goalpp/pp)^1.2
    return playtime * Math.pow(goalpp / pp, 1.2);
}

// Function to update grid-template-columns for elements with the class
function updateElementStyles() {
    // Select all elements with the class 'profile-detail__values--grid'
    const elements = document.querySelectorAll('.profile-detail__values--grid');

    // Loop through each element and update its style
    elements.forEach(element => {
        element.style.gridTemplateColumns = 'repeat(5, 1fr)';
    });
}

function updateElementGap(newGap) {
    // Select all elements with the class 'profile-detail__values'
    const elements = document.querySelectorAll('.profile-detail__values');

    // Loop through each element and update its style
    elements.forEach(element => {
        element.style.gap = newGap;
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.additionalPlaytimeHours) {
            ii(Number(request.additionalPlaytimeHours), true);
            console.log("ii lol");
            sendResponse(request);
        }
        if (request.goalpp) {
            console.log("goalpp lol");
            sendResponse(predictFuture(Number(request.goalpp)));
        }
    }
);
