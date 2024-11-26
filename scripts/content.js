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
ii(0);

window.navigation.addEventListener("navigate", (event) => {
    console.log("navigate detected");
    //matches /users/<id>/osu though the /osu is optional and other gamemodes (taiko, mania, fruits) won't match
    const regex = /\/users\/\d+(\/osu)?$/;
    if (regex.test(event.destination.url))
        ii(0);
})

function ii(additionalPlaytimeHours) {
    console.log("executing...")
    /** TODO FIX
     * 
     * Timeout of 2 seconds to ensure site is fully loaded. Necessary, bc it's a
     * SPA and that messes with the document_idle thingy in the manifest, idk what im doing
     * Yes I know this is a shitty solution and will break when it loads slower than that
     * */
    setTimeout(function () {
        /**
         * @type UserData
         */
        const userData = JSON.parse(document.body.querySelector('.js-react--profile-page').attributes.getNamedItem('data-initial-data').value)
        const pp = userData.user.statistics.pp;
        const playtime = userData.user.statistics.play_time + additionalPlaytimeHours * 3600;

        // Compute expected playtime and ii, prerework: 1.16e-3 * Math.pow(pp, 1.17) and playtime/24
        const expectedpp = 0.001956 * playtime + 67.209899;
        const ii = pp / expectedpp;

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
    }, 2000)
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
            ii(Number(request.additionalPlaytimeHours));
            console.log("ii lol");
            sendResponse(request);
        }
        if (request.goalpp) {
            console.log("goalpp lol");
            sendResponse(predictFuture(Number(request.goalpp)));
        }
    }
);
