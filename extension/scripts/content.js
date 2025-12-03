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


if (/\/users\/\d+/.test(document.location.href)) ii(0, true);

window.addEventListener('turbo:load', () => {
    // Check if we're on a profile page and trigger ii if so
    if (/\/users\/\d+/.test(document.location.href)) ii(0, true);
});

async function ii(additionalPlaytimeHours, newLoad = false) {

    if (!newLoad) {
        // Use a MutationObserver to wait for the lazy loaded values to get populated
        let waitForData = new Promise((resolve, reject) => {
            var observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                    if (node.querySelectorAll('.js-react[data-react="profile-page"]')) {
                        observer.disconnect();
                        resolve();
                    }
                }));
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
        await waitForData;
    }

    /**
     * @type UserData
     */
    const userData = JSON.parse(document.body.querySelector('.js-react[data-react="profile-page"]').attributes.getNamedItem('data-initial-data').value);

    const pp = userData.user.statistics.pp;
    const playtime = userData.user.statistics.play_time / 3600 + additionalPlaytimeHours;

    // Compute expected playtime and ii, prerework: 1.16e-3 * Math.pow(pp, 1.17) and playtime/24
    const ii = calculateExpectedPlaytime(pp, userData.current_mode) / playtime;

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
    }

    const outerDiv = document.createElement('div');
    outerDiv.className = 'value-display value-display--plain';
    outerDiv.id = 'iiElement';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'value-display__label';
    labelDiv.textContent = 'ii';

    const valueDiv = document.createElement('div');
    valueDiv.className = 'value-display__value';
    valueDiv.textContent = ii > 0 && pp > 0 && playtime > 0 ? ii.toFixed(2) + "x" : "-";

    let color;
    if (ii > 1) {
        color = `hsl(120, 100%, ${100 - 50 * (1 - (1 / ii))}%)`;
    } else if (ii < 1 && ii > 0) {
        color = `hsl(0, 100%, ${100 - 50 * (1 - ii)}%)`;
    }

    valueDiv.style.color = color;

    outerDiv.appendChild(labelDiv);
    outerDiv.appendChild(valueDiv);

    parentElement.appendChild(outerDiv)
}

function predictFuture(goalpp) {
    const userData = JSON.parse(document.body.querySelector('.js-react[data-react="profile-page"]').attributes.getNamedItem('data-initial-data').value)
    const pp = userData.user.statistics.pp;
    const expectedPlaytime = calculateExpectedPlaytime(goalpp, userData.current_mode);
    const playtime = userData.user.statistics.play_time / 3600;
    const ii = calculateExpectedPlaytime(pp, userData.current_mode) / playtime;
    //playtime*(goalpp/pp)^1.2
    return (1 / ii) * expectedPlaytime;
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

browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.additionalPlaytimeHours) {
            ii(Number(request.additionalPlaytimeHours), true);
            sendResponse(request);
        }
        if (request.goalpp) {
            sendResponse(predictFuture(Number(request.goalpp)));
        }
    }
);

function calculateExpectedPlaytime(pp, mode) {
    switch (mode) {
        case "osu":
            return -12 + 0.0781 * pp + 6.01e-6 * Math.pow(pp, 2);
        case "taiko":
            return -1.08 + 0.0179 * pp + 1.65e-6 * Math.pow(pp, 2);
        case "mania":
            return -0.601 + 0.0321 * pp + 7.69e-7 * Math.pow(pp, 2);
        case "fruits":
            return -4.14 + 0.0458 * pp + 2.38e-6 * Math.pow(pp, 2);
    }
}
