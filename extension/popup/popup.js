document.addEventListener('DOMContentLoaded', () => {
    const additionalPlaytimeHours = document.getElementById("additionalPlaytimeHours");
    const goalpp = document.getElementById("goalpp");

    // Listen for when the user inputs a value
    additionalPlaytimeHours.addEventListener('change', async () => {
        // If empty/null, reset to 0
        if (!additionalPlaytimeHours.value) additionalPlaytimeHours.value = "0";

        // Only run the code when the user has entered a value
        if (additionalPlaytimeHours.value) {
            const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await browser.tabs.sendMessage(tab.id, { additionalPlaytimeHours: additionalPlaytimeHours.value });
        }
    });

    goalpp.addEventListener('change', async () => {
        if (goalpp.value) {
            const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await browser.tabs.sendMessage(tab.id, { goalpp: goalpp.value });
            const predictFutureElement = document.getElementById("expectedPlaytimeForGoalpp");
            predictFutureElement.textContent = "This player needs approximately " + convertHours(response) + " or " + Math.round(response) + " hours of playtime to reach the given pp";
        }
    });
});

function convertHours(response) {
    // Calculate the number of days
    const days = Math.floor(response / 24);

    // Calculate the remaining hours after subtracting the days
    const remainingHours = Math.floor(response % 24);

    // Calculate the number of minutes if there are any remaining fractions of an hour
    const minutes = Math.floor((response % 1) * 60);

    // Construct the result string
    let result = `${days}d ${remainingHours}h`;

    // Add minutes to the string if necessary
    if (minutes > 0) {
        result += ` ${minutes}m`;
    }

    return result;
}