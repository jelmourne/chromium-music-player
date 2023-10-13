import { concertsArr } from "./app";

// Delay timer used for search
function debounce(func, duration) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, duration);
  };
}

// Retrieves profile object from Spotify API
async function getProfile() {
  let accessToken = localStorage.getItem("access_token");

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  return await response.json();
}

// Search function
async function getSearch(Query) {
  let accessToken = localStorage.getItem("access_token");

  let args = new URLSearchParams({
    q: Query,
    type: "track",
    limit: 5,
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${args}`, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });
  return await response.json();
}

// Get users list of playlists
async function getUserPlaylist() {
  let accessToken = localStorage.getItem("access_token");
  const profile = await getProfile();

  const response = await fetch(
    `https://api.spotify.com/v1/users/${await profile.id}/playlists`,
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  return await response.json();
}

// Set shuffle playback
async function setSuffle(value) {
  let accessToken = localStorage.getItem("access_token");
  console.log(value);

  let args = new URLSearchParams({
    state: value,
  });

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/${
      value == "true" ? "shuffle?" + args : "shuffle"
    }`,
    {
      method: "put",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  ).then((data) => {
    console.log(data);
  });
}

// Set repeat mode

// Keeps track of remaining song duration
function getMinAndSec(ms) {
  var min = Math.floor(ms / 60000);
  var sec = ((ms % 60000) / 1000).toFixed(0);

  return sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
}

// Function that calls ticketmaster API to fetch events in the users country. It takes the user's
// country as an argument and returns an array of events. The function will loop through the fetched
// data and store the name, date, time, url, and image of the event. Duplicate tours in different cities will be ignored.

async function getEvents(userCountry) {
  const rootURL = "https://app.ticketmaster.com/discovery/v2/";
  const apiKey = "MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V";

  try {
    const response = await fetch(
      `${rootURL}events.json?classificationName=music&apikey=${apiKey}&countryCode=${userCountry}`
    );
    const data = await response.json();
    // console.log(data)
    let fetchedEvents = data._embedded.events;
    let filteredEvents = [];
    for (let i = 0; i < fetchedEvents.length; i++) {
      let event = {
        name: fetchedEvents[i].name,
        date: new Date(fetchedEvents[i].dates.start.localDate),
        time: fetchedEvents[i].dates.start.localTime,
        link: fetchedEvents[i].url,
        image: fetchedEvents[i].images[0].url,
        genre: fetchedEvents[i].classifications[0].genre.name,
      };

      if (i > 0) {
        if (
          // Check if name of last concert added is the same as current event
          filteredEvents[filteredEvents.length - 1].name.includes(
            event.name.substr(0, 5)
          )
        ) {
          continue;
        }
      }
      filteredEvents.push(event);
    }

    return filteredEvents;
  } catch (ex) {
    console.log(ex);
  }
}

// Add concert to favourites (local storage)
function addToFavourites(concertUrl) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || {};
  concertsArr.forEach((concert) => {
    if (concert.link.includes(concertUrl)) {
      favourites[concertUrl] = concert;
      localStorage.setItem("favourites", JSON.stringify(favourites));
      let savedIcon = document.getElementById(concertUrl + "icon");
      savedIcon.className = "fa-solid fa-bookmark mx-3";
    }
  });
  alert("Concert bookmark added :-)");
}

// Remove concert from favourites (local storage)
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

  alert("Concert bookmark removed");
}

function addButtonListeners(arr) {
  Array.from(arr).forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.id + "icon").className ==
      "fa-regular fa-bookmark mx-3"
        ? addToFavourites(btn.id)
        : removeFavourite(btn.id);
    });
  });
}

function showSavedConcerts() {
  const concertsContainer = document.getElementById("events-container");
  let favourites = JSON.parse(localStorage.getItem("favourites"));
  let bookmarkIconClass;

  concertsContainer.innerHTML = "";
  Object.values(favourites).forEach((savedConcert) => {
    bookmarkIconClass = favourites[savedConcert.link]
      ? "fa-solid fa-bookmark mx-3"
      : "fa-regular fa-bookmark mx-3";
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full">
      <div class="flex-col">
        <h4 class="mb-2 font-semibold">${savedConcert.name}</h4>
        <p>${new Date(savedConcert.date).toDateString()} @ ${
      savedConcert.time
    }</p>
      </div>
      <div class="flex">
        <!-- Save to Favourites -->
        <button id="${savedConcert.link}" class="remove-btn" type="button">
          <i id="${
            savedConcert.link + "icon"
          }" class="${bookmarkIconClass}"></i>
        </button>
        <!-- Buy Ticket -->
        <a class="buy-ticket-link" href="${savedConcert.link}" target="_blank">
          <button class="buy-ticket-btn" type="button">
          <i class="fa-solid fa-ticket mx-3"></i>
          </button>
        </a>
      </div>
    </div>`;
  });

  addButtonListeners(document.getElementsByClassName("remove-btn"));

  document.getElementById("toggle-favs-text").innerHTML = "Show All Concerts";
  document.getElementById("toggle-favs-btn").addEventListener("click", () => {
    showAllConcerts(concertsArr);
  });
}

function showAllConcerts(arr) {
  const concertsContainer = document.getElementById("events-container");
  const favourites = JSON.parse(localStorage.getItem("favourites")) || {};
  const bookmarkButtonArr = document.getElementsByClassName("save-btn");

  concertsContainer.innerHTML = "";
  // Create concert information component from fetched data
  arr.forEach((concert) => {
    let bookmarkIconClass = favourites[concert.link]
      ? "fa-solid fa-bookmark mx-3"
      : "fa-regular fa-bookmark mx-3";
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full">
    <div class="flex-col">
      <h4 class="mb-2 font-semibold">${concert.name}</h4>
      <p>${concert.date.toDateString()} @ ${concert.time}</p>
    </div>
    <div class="flex">
      <!-- Save to Favourites -->
      <button id="${concert.link}" class="save-btn" type="button">
        <i id="${concert.link + "icon"}" class="${bookmarkIconClass}"></i>
      </button>
      <!-- Buy Ticket -->
      <a class="buy-ticket-link" href="${concert.link}" target="_blank">
        <button class="buy-ticket-btn" type="button">
          <i class="fa-solid fa-ticket mx-3"></i>
        </button>
      </a>
    </div>
  </div>`;
  });

  addButtonListeners(bookmarkButtonArr);

  document.getElementById("toggle-favs-text").innerHTML = "Show Saved Concerts";
  document.getElementById("toggle-favs-btn").addEventListener("click", () => {
    showSavedConcerts(concertsArr);
  });
}

export {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
  showSavedConcerts,
  showAllConcerts,
  debounce,
  getMinAndSec,
  setSuffle,
};
