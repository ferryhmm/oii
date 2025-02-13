# oii - osu! improvement indicator

<p align="center">
  <img src="https://github.com/ferryhmm/oii/blob/main/images/oii128.png" />
</p>

A browser extension, that adds ii (improvement indicator, a metric that compares your pp to the average player with your playtime amount) to user profiles on the osu! website.


## General

ii is a value describing the relationship between the players playtime and the expected amount of playtime based on pp. Simply put: It describes a players improvement speed compared to the average.

$$
ii = \frac{expected playtime}{actual playtime} 
$$

The expected playtime describes the playtime the average player would need to reach the given pp. The function for this was modelled off of a trendline showing the relationship between playtime and pp on a dataset with a sample of 10.000 players.

$$
expected playtime = -3.94 + 0.067 \cdot pp + 6.78 \times 10^{-6} \cdot pp^2
$$

Thus the formula for calculating the ii value is as follows:

$$
ii = \frac{-3.94 + 0.067 \cdot pp + 6.78 \times 10^{-6} \cdot pp^2}{playtime_{hours}} 
$$


For more information, you can watch [this](https://www.youtube.com/watch?v=F8qqWkmtCG0) video. The data used to create the function can be found [here](https://docs.google.com/spreadsheets/d/1uiXBByPjOqOvEGd0QbGaDst6KkuVsww2Q0ropcMlTVY).

If you have any questions or want to contribute, feel free to join my [discord server](https://discord.com/invite/cT6vzbvpe8).

## How to install

This extension is currently available for Chrome and Firefox with each having two ways to install it:

### Chrome
#### Via Chrome Webstore

For the latest stable release and automatic updates, it is recommended to install the extension [here](https://chromewebstore.google.com/detail/oii/dmodoodhamgjfnfnokgflekfjgjagpna).

#### Via GitHub

Alternatively, to get the latest (though not necessarily stable) build, install the extension through these steps. Keep in mind, that the extension will not update automatically this way:

1. Download and unzip the repository
2. Navigate to the [extensions](chrome://extensions/) in your Chrome browser
3. Enable developer mode (top right)
4. Click "Load unpacked" and select the osu!ii folder from step 1

For a more detailed explanation check out [this](https://www.youtube.com/watch?v=nmSpWQJuTaQ) video tutorial.


### Firefox
#### Via Firefox Addons

For the latest stable release and automatic updates, it is recommended to install the extension [here](https://addons.mozilla.org/en/firefox/addon/oii/).

#### Via GitHub

Alternatively, to get the latest (though not necessarily stable) build, install the extension through these steps. Keep in mind, that the extension will not update automatically this way and will only stay installed until the next time you restart firefox:

1. Download and unzip the repository
2. Navigate to the [debugging page](about:debugging) in your Firefox browser
3. Click on "Load Temporary Add-on", then select any file within the osu!ii folder from step 1

Alternatively, you can use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) to run the extension from the command line (useful for debugging).