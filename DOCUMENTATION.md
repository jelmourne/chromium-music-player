# Spotify Chrome Extension - Documentation

<h4 align="center">
  Below is code documentation, describes the process of our application.
</h4>

| [Authorization](#authorization) | [Api Methods](#api-methods) | [Helper Methods](#helper-methods) | [DOM Manipulation](#dom-manipulation) | [Spotify Player](#spotify-player)

---

<!-- Body -->

### Authorization
---

#### Description 
This function generates a random string of the specified length using characters from the set of uppercase letters (A-Z), lowercase letters (a-z), and digits (0-9).

#### Returns
A randomly generated string of the specified length.

```javascript
function generateRandomString(length) {
  let text = "";
  let possible ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```
---
#### Description 
This asynchronous function is used to generate a code verifier for OAuth 2.0 authentication with Spotify. It takes the provided `codeVerify` as input and computes a SHA-256 hash of it, followed by Base64 encoding.

#### Returns
`codeVerify` (String): A random string that serves as the code verifier for OAuth 2.0 authentication.
```javascript
async function generateCodeVerify(codeVerify) {
  function base64Encode(string) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  const encode = new TextEncoder();
  const data = encode.encode(codeVerify);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  
  return base64Encode(digest);
}
```
---

#### Description
This function is responsible for initiating the Spotify authorization process. It generates the necessary code verifier, constructs the authorization URL, and handles the OAuth flow for obtaining an access token.
```javascript
function authorization() {
  const clientId = "5b338b4d10ee44f18513726b9af414fb";
  const redirectUri = window.location.origin+"/";
  let codeVerify = generateRandomString(128);

  generateCodeVerify(codeVerify).then((codeChallenge) => {
    let state = generateRandomString(16);
    let scope = "streaming app-remote-control user-modify-playback-state user-read-currently-playing playlist-read-private user-read-email user-read-private user-read-playback-state";
    localStorage.setItem("code_verifier", codeVerify);
    
    let args = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    
    window.location = "https://accounts.spotify.com/authorize?" + args;
  });

  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get("code");
  let codeVerifier = localStorage.getItem("code_verifier");

  let body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body,
  }).then((response) => {
      if (!response.ok) {
        throw new Error("HTTP status " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      localStorage.setItem("access_token", data.access_token);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
```
---

### Api Methods
---
#### Description
This asynchronous function retrieves the user's profile object from the Spotify API using the access token stored in local storage.
#### Returns
A promise that resolves with the user's profile data from the Spotify API.
```javascript
async function getProfile() {
  let accessToken = localStorage.getItem("access_token");
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });
  return await response.json();
}
```
---
#### Description
This asynchronous function performs a search in the Spotify API for albums and tracks based on the provided `Query`. It uses the access token stored in local storage for authentication.
#### Returns
A promise that resolves with the search results from the Spotify API.

```javascript
async function getSearch(Query) {
  let accessToken = localStorage.getItem("access_token");
  let args = new URLSearchParams({
    q: Query,
    type: ["album", "track"],
    limit: 4,
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${args}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });
  return await response.json();
}
```
---
#### Description
This asynchronous function retrieves the user's list of playlists from the Spotify API. It first obtains the user's profile and then fetches the playlists associated with the user.
#### Returns
A promise that resolves with the user's playlists from the Spotify API.
```javascript
async function getUserPlaylist() {
  let accessToken = localStorage.getItem("access_token");
  const profile = await getProfile();
  const response = await fetch(
    `https://api.spotify.com/v1/users/${await  profile.id}/playlists`,
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );
  return await response.json();
}
```
---

#### Description
This asynchronous function is used to set the shuffle playback mode on the user's Spotify account. It takes a boolean `value` to enable or disable shuffle mode.
```javascript
async function setShuffle(value) {
  let accessToken = localStorage.getItem("access_token");
  let args = new URLSearchParams({
    state: value,
  });
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/shuffle?${args}`,
    {
      method: "put",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );
}
```
---
#### Description
This asynchronous function is used to set the repeat mode on the user's Spotify account. It takes a string `value`, which can be "true" to enable track repeat or "false" to disable repeat mode.
```javascript
async function setRepeat(value) {
  let accessToken = localStorage.getItem("access_token");
  let args = new URLSearchParams({
    state: value == "false" ? "off" : "track",
  });
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/repeat?${args}`,
    {
      method: "put",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  )
}
```
---
#### Description
This asynchronous function retrieves the genre information for a specific artist from the Spotify API using their artist API URL. It utilizes the user's access token for authentication and makes an API request to fetch the artist's genre data.
#### Returns
A promise that resolves with an array of genres associated with the artist.
```javascript
async function getArtistGenre(artistAPIUrl) {
  let accessToken = localStorage.getItem("access_token");
  return fetch(artistAPIUrl, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  })
    .then((res) => res.json())
    .then((artistInfo) => {
      return artistInfo.genres;
    });
}
```
---

#### Description
This asynchronous function is used to play a track, playlist, or album on the user's Spotify account. It takes a `uri` parameter representing the URI of the item to be played and a `type` parameter indicating the type of item (e.g., "track", "playlist", or "album").
```javascript
async function playSong(uri, type) {
  const accessToken = localStorage.getItem("access_token");
  const data = {
    offset: {
      position: 0,
    },
  };
  if (type == "track") {
    Object.assign(data, { uris: [uri] });
  } else {
    Object.assign(data, { context_uri: uri });
  }
  const response = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    body: JSON.stringify(data),
    headers: new Headers({
      Authorization: "Bearer " + accessToken,
    }),
  });
}
```
---
#### Description
This asynchronous function retrieves a list of events (concerts, shows, etc.) from Ticketmaster's Discovery API based on the specified user's country and genre preferences. The function filters and processes the data to provide a list of distinct events.
#### Returns
A promise that resolves with an array of distinct events that match the specified criteria.
```javascript
async function getEvents(userCountry, genre) {
  const rootURL = "https://app.ticketmaster.com/discovery/v2/";
  const apiKey = "MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V";
  if (genre.length == 0) {
    genre = "pop";
  } else {
    genre = genre[0];
  }

  if (genre.includes("pop") || genre.includes("band")) {
    genre = "pop";
  } else if (genre.includes("house")) {
    genre = "house";
  } else if (genre.includes("indie")) {
    genre = "indie";
  } else if (genre.includes("rock")) {
    genre = "rock";
  } else if (genre.includes("country")) {
    genre = "country";
  } else if (genre.includes("hip hop") || genre.includes("rap")) {
    genre = "rap";
  } else if (
    genre.includes("electronic") ||
    genre.includes("dance") ||
    genre.includes("edm") ||
    genre.includes("step") ||
    genre.includes("big room")
  ) {
    genre = "electronic";
  }
  try {
    const response = await fetch(
      `${rootURL}events.json?classificationName=${genre}&apikey=${apiKey}&countryCode=${userCountry}&size=50`
    );
    const data = await response.json();
    let fetchedEvents = data._embedded.events;
    let filteredEvents = [];
    filteredEvents.push(fetchedEvents[0]);
    for (let i = 1; i < fetchedEvents.length; i++) {
      if (
        !fetchedEvents[i].name.includes(
          fetchedEvents[i - 1].name.substring(0, 3))) {
        filteredEvents.push(fetchedEvents[i]);
      }
    }
    filteredEvents.map((concert) => {
      if (concert.name.length > 30) {
        concert.name = concert.name.substring(0, 29) + "...";
      } else {
        concert.name = concert.name;
      }
      concert.date = new Date(concert.dates.start.localDate);
      concert.time = concert.dates.start.localTime;
      concert.link = concert.url;
    });
    return filteredEvents;
  } catch (ex) {
    console.log(ex);
  }
}
```

---




### Helper Methods
---
#### Description
This function is used to debounce another function. It delays the execution of the provided `func` by the specified `duration` (in milliseconds) after the last call.
#### Returns
A debounced function that delays the execution of `func`.
```javascript
function debounce(func, duration) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, duration);
  };
}
```
---
#### Description
This function converts milliseconds (`ms`) into a formatted string representing minutes and seconds.
#### Returns
A formatted string in the format `mm:ss`.
```javascript
function getMinAndSec(ms) {
  var min = Math.floor(ms / 60000);
  var sec = ((ms % 60000) / 1000).toFixed(0);
  return sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
}
```
---

### DOM Manipulation
---
#### Description
This event listener listens for changes in the search input field. It uses a debounce function to prevent frequent API requests and UI updates while the user is typing. When the input changes, it fetches search results using `getSearch` and updates the search results container (`searchResults`) with album and track information. Clicking on the search results triggers the `playSong` function.
```javascript
search.addEventListener(
  "input",
  debounce(() => {
    searchResults.innerHTML = "";
    getSearch(search.value).then((response) => {
      searchResults.innerHTML = `<li
        class="flex w-auto bg-white p-2 hover:bg-green-500 dark:hover:bg-green-500 dark:bg-neutral-900 dark:text-white hover:text-white transition-all cursor-pointer" onclick="playSong('${response.albums.items[0].uri}', 'album')">
        <div class="flex flex-col">
          <img
            class="h-14 aspect-square"
            src="${response.albums.items[0].images[0].url}"
            alt="${response.albums.items[0].name}"
          />
        </div>
        <div class="flex flex-col mx-3">
          <h1 class="text-lg">${response.albums.items[0].name}</h1>
          <div class="flex flex-row">
            <p>${response.albums.items[0].artists[0].name}</p>
          </div>
        </div>
      </li><hr>`;
      response.tracks.items.forEach((element) => {
        searchResults.innerHTML += `<li
        class="flex w-auto bg-white p-2 hover:bg-green-500 dark:hover:bg-green-500 dark:bg-neutral-900 dark:text-white hover:text-white transition-all cursor-pointer" onclick="playSong('${element.uri}','track')">
        <div class="flex flex-col">
          <img
            class="h-14 aspect-square"
            src="${element.album.images[0].url}"
            alt="${element.name}"
          />
        </div>
        <div class="flex flex-col mx-3">
          <h1 class="text-lg">${element.name}</h1>
          <div class="flex flex-row">
 ${element.explicit == true? "<p class='text-lg me-2'>&#127348</p>": ""}
            <p>${element.artists[0].name}</p>
          </div>
        </div>
      </li><hr>`;
      });
    });
  }, 300)

);
```
---
#### Description
This event listener populates a playlist dropdown with user playlists. If there are playlists available, it iterates through the playlist items and renders each playlist with its name, cover image, track count, and owner's display name. Clicking on a playlist triggers the `playSong` function. If there are no playlists available, it displays a message indicating no playlists are available.
```javascript
if (parseInt(playlist.total) != 0) {
  playlist.items.forEach((element) => {
    playlistResult.innerHTML += `<li
          class="flex w-auto bg-white p-1 hover:bg-green-500 dark:hover:bg-green-500 hover:text-white dark:bg-neutral-900 dark:text-white transition-all cursor-pointer" onclick="playSong('${element.uri}', 'playlists')">
          <div class="flex flex-col">
            <img
              src="${element.images[0].url}"
              class="h-14 aspect-square"
            />
          </div>
          <div class="flex flex-col mx-3">
            <h1 class="text-lg">${element.name}</h1>
            <div class="flex flex-row">
<p>Tracks: ${element.tracks.total}</p>
<p>&nbsp ${element.owner.display_name == "undefined"? "": element.owner.display_name}</p>
            </div>
          </div>
        </li><hr>`;
  });
} else {
  playlistResult.innerHTML =
    "<li class='flex w-auto bg-white dark:bg-neutral-900 dark:text-white p-1 m-6'>No Playlist Available</li>";
}
```
---
#### Description
This function is responsible for displaying a list of concerts in the "events-container" on the webpage. It takes an array of concert data (`arr`) as input, processes the data, and renders each concert as a component with options to save to favorites or buy tickets.
```javascript
function showAllConcerts(arr) {
  const concertsContainer = document.getElementById("events-container");
  const favourites = JSON.parse(localStorage.getItem("favourites")) || {};
  const bookmarkButtonArr = document.getElementsByClassName("save-btn");
  concertsContainer.innerHTML = "";
  arr.forEach((concert) => {
    let bookmarkIconClass = favourites[concert.link]
      ? "fa-solid fa-bookmark mx-3"
      : "fa-regular fa-bookmark mx-3";
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full dark:text-white">
    <div class="flex-col text-sm">
      <h4 class="mb-2 font-semibold">${concert.name}</h4>
      <p>${new  Date(concert.date).toDateString()} @ ${concert.time}</p>
    </div>
    <div class="flex">
      <button id="${concert.link}" class="save-btn" type="button">
        <i id="${concert.link + "icon"}" class="${bookmarkIconClass}"></i>
      </button>
      <a class="buy-ticket-link" href="${concert.link}" target="_blank">
        <button class="buy-ticket-btn" type="button">
        <i class="fa-solid fa-ticket mx-3"></i>
        </button>
      </a>
    </div>
  </div>`;
  });
  document.getElementById("show-all-btn").hidden = true;
  document.getElementById("show-saved-btn").hidden = false;
  addButtonListeners(bookmarkButtonArr);
}
```
---
#### Description
This function displays a list of saved concerts in the "events-container" on the webpage. It retrieves the saved concert data from local storage, processes it, and renders each saved concert as a component with options to remove from favorites or buy tickets.
```javascript
function showSavedConcerts() {
  const concertsContainer = document.getElementById("events-container");
  let favourites = JSON.parse(localStorage.getItem("favourites"));
  let bookmarkIconClass;
  concertsContainer.innerHTML = "";
  Object.values(favourites).forEach((savedConcert) => {
    bookmarkIconClass = favourites[savedConcert.link]
      ? "fa-solid fa-bookmark mx-3"
      : "fa-regular fa-bookmark mx-3";
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full dark:text-white">
      <div class="flex-col text-sm">
        <h4 class="mb-2 font-semibold">${savedConcert.name}</h4>
        <p>${new  Date(savedConcert.date).toDateString()} @ ${savedConcert.time}</p>
      </div>
      <div class="flex">
        <button id="${savedConcert.link}" class="remove-btn" type="button">
          <i id="${savedConcert.link + "icon"}" class="${bookmarkIconClass}"></i>
        </button>
        <a class="buy-ticket-link" href="${savedConcert.link}" target="_blank">
          <button class="buy-ticket-btn" type="button">
          <i class="fa-solid fa-ticket mx-3"></i>
          </button>
        </a>
      </div>
    </div>`;
  });
  addButtonListeners(document.getElementsByClassName("remove-btn"));
  document.getElementById("show-saved-btn").hidden = true;
  document.getElementById("show-all-btn").hidden = false;
}
```
---
#### Description
This function allows users to add a concert to their list of favorites. It stores the concert details in local storage, making it accessible for later reference. Additionally, it updates the user interface to indicate that the concert has been added to favorites.
```javascript
function addToFavourites(concertUrl) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || {};
  concerts.forEach((concert) => {
    if (concert.link.includes(concertUrl)) {
      favourites[concertUrl] = concert;
      localStorage.setItem("favourites", JSON.stringify(favourites));
      let savedIcon = document.getElementById(concertUrl + "icon");
      savedIcon.className = "fa-solid fa-bookmark mx-3";
    }
  });
}
```
---
#### Description
This function allows users to remove a concert from their list of favorites. It deletes the concert's details from local storage and updates the user interface to reflect the removal.
```javascript
function removeFavourite(concertUrl) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || {};
  if (favourites[concertUrl]) {
    delete favourites[concertUrl];
    localStorage.setItem("favourites", JSON.stringify(favourites));
    let notSavedIcon = document.getElementById(concertUrl + "icon");
    notSavedIcon.className = "fa-regular fa-bookmark mx-3";
    if (
      document.getElementById("toggle-favs-text").innerHTML ==
      "Show All Concerts"
    ) {
      showSavedConcerts();
    }
  }
}
```
---
### Spotify Player
---
#### Description
This code integrates the Spotify Web Playback SDK into a web application. The Spotify Web Playback SDK allows the application to control and display information about the currently playing track on a user's Spotify account.
### Initialization
The `window.onSpotifyWebPlaybackSDKReady` event listener is triggered when the Spotify Web Playback SDK is ready for use.
```javascript
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = localStorage.getItem("access_token");
  const player = new Spotify.Player({
    name: "Chrome Extension",
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.2,
  });
  player.addListener("ready", ({ device_id }) => {
    const accessToken = localStorage.getItem("access_token");
    console.log("Changing to device");
    let changeDevice = fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      body: JSON.stringify({
        device_ids: [device_id],
        play: false,
      }),
      headers: new Headers({
        Authorization: "Bearer " + accessToken,
      }),
    });
  });
  player.addListener("not_ready", ({ device_id }) => {
    console.log("Device ID has gone offline", device_id);
  });
  player.addListener("authentication_error", ({ message }) => {
    console.error(message);
  });
  player.addListener("account_error", ({ message }) => {
    console.error(message);
  });
  player.connect().then((success) => {
    if (success) {
      console.log("The Web Playback SDK successfully connected to Spotify!");
    }
  });
  var timer;
  function playbackTimer(start, endTime) {
    let startTime = start;
    timer = window.setInterval(() => {
      startTime = new Date(startTime.getTime() + 1000);
      duration.value = startTime;
      currentTime.innerHTML = getMinAndSec(startTime);
      if (startTime >= endTime) {
        clearTimeout(timer);
        duration.value = 0;
        currentTime.innerHTML = "0:00";
      }
    }, 1000);
  }
  player.on("player_state_changed", async (state) => {
    let startTime = new Date(state.position);
    let endTime = new Date(state.duration);
    if (!timer) {
      playbackTimer(startTime, endTime);
    } else {
      clearInterval(timer);
      playbackTimer(startTime, endTime);
    }
    if (!state.paused) {
      playButton.classList.add("fa-circle-pause");
      playButton.classList.add("fa-solid");
    } else {
      playButton.classList.remove("fa-circle-pause");
      playButton.classList.remove("fa-solid");
      clearInterval(timer);
    }
    let currentTrackName = state.track_window.current_track.name;
    document.getElementById("current-song-name").innerHTML =
      currentTrackName.length > 30
        ? currentTrackName.substring(0, 29) + "..."
        : currentTrackName;
    document.getElementById("current-song-img").src =
      state.track_window.current_track.album.images[0].url;
    document.getElementById("current-song-artist").innerHTML =
      state.track_window.current_track.artists[0].name;
    currentTime.innerHTML = getMinAndSec(state.position);
    document.getElementById("endTime").innerHTML = getMinAndSec(state.duration);
    duration.max = endTime;
    duration.value = startTime;
    filterConcertsByGenre(state.track_window.current_track.artists[0].url);
  });
  playButton.onclick = function () {
    player.togglePlay();
  };
  document.getElementById("prevTrack").onclick = function () {
    player.previousTrack();
  };
  document.getElementById("nextTrack").onclick = function () {
    player.nextTrack();
  };
};
```

