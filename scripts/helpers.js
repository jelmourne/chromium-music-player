import { concerts } from './app';

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
  let accessToken = localStorage.getItem('access_token');

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  });

  return await response.json();
}

// Search function
async function getSearch(Query) {
  let accessToken = localStorage.getItem('access_token');

  let args = new URLSearchParams({
    q: Query,
    type: ['album', 'track'],
    limit: 4,
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${args}`, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  });
  return await response.json();
}

// Get users list of playlists
async function getUserPlaylist() {
  let accessToken = localStorage.getItem('access_token');
  const profile = await getProfile();

  const response = await fetch(
    `https://api.spotify.com/v1/users/${await profile.id}/playlists`,
    {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );

  return await response.json();
}

// Set shuffle playback
async function setShuffle(value) {
  let accessToken = localStorage.getItem('access_token');

  let args = new URLSearchParams({
    state: value,
  });

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/${
      value == 'true' ? 'shuffle?' + args : 'shuffle'
    }`,
    {
      method: 'put',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );
}

// Set repeat mode
async function setRepeat(value) {
  let accessToken = localStorage.getItem('access_token');

  let args = new URLSearchParams({
    state: value == 'false' ? 'off' : 'track',
  });

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/repeat?${args}`,
    {
      method: 'put',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }
  ).then((data) => console.log(data));
}

// Keeps track of remaining song duration
function getMinAndSec(ms) {
  var min = Math.floor(ms / 60000);
  var sec = ((ms % 60000) / 1000).toFixed(0);

  return sec == 60 ? min + 1 + ':00' : min + ':' + (sec < 10 ? '0' : '') + sec;
}

// Function that calls ticketmaster API to fetch events in the users country. It takes the user's
// country as an argument and returns an array of events. The function will loop through the fetched
// data and store the name, date, time, url, and image of the event. Duplicate tours in different cities will be ignored.

async function getEvents(userCountry, genre) {
  const rootURL = 'https://app.ticketmaster.com/discovery/v2/';
  const apiKey = 'MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V';

  if (genre.length == 0) {
    genre = 'pop';
  } else {
    genre = genre[0];
  }

  if (genre.includes('pop') || genre.includes('band')) {
    genre = 'pop';
  } else if (genre.includes('house')) {
    genre = 'house';
  } else if (
    genre.includes('electronic') ||
    genre.includes('edm') ||
    genre.includes('step')
  ) {
    genre = 'electronic';
  } else if (genre.includes('rock')) {
    genre = 'rock';
  }

  try {
    const response = await fetch(
      `${rootURL}events.json?classificationName=${genre}&apikey=${apiKey}&countryCode=${userCountry}&size=200`
    );
    const data = await response.json();
    let fetchedEvents = data._embedded.events;
    let filteredEvents = [];

    for (let i = 1; i < fetchedEvents.length; i++) {
      if (
        !fetchedEvents[i].name.includes(
          fetchedEvents[i - 1].name.substring(0, 3)
        )
      ) {
        filteredEvents.push(fetchedEvents[i]);
      }
    }

    filteredEvents.map((concert) => {
      concert.date = new Date(concert.dates.start.localDate);
      concert.time = concert.dates.start.localTime;
      concert.link = concert.url;
    });
    return filteredEvents;
  } catch (ex) {
    console.log(ex);
  }
}

// Add concert to favourites (local storage)
function addToFavourites(concertUrl) {
  let favourites = JSON.parse(localStorage.getItem('favourites')) || {};
  concerts.forEach((concert) => {
    if (concert.link.includes(concertUrl)) {
      favourites[concertUrl] = concert;
      localStorage.setItem('favourites', JSON.stringify(favourites));
      let savedIcon = document.getElementById(concertUrl + 'icon');
      savedIcon.className = 'fa-solid fa-bookmark mx-3';
    }
  });
}

// Remove concert from favourites (local storage)
function removeFavourite(concertUrl) {
  let favourites = JSON.parse(localStorage.getItem('favourites')) || {};

  if (favourites[concertUrl]) {
    delete favourites[concertUrl];
    localStorage.setItem('favourites', JSON.stringify(favourites));
    let notSavedIcon = document.getElementById(concertUrl + 'icon');
    notSavedIcon.className = 'fa-regular fa-bookmark mx-3';
    if (
      document.getElementById('toggle-favs-text').innerHTML ==
      'Show All Concerts'
    ) {
      showSavedConcerts();
    }
  }
}

function addButtonListeners(arr) {
  Array.from(arr).forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.id + 'icon').className ==
      'fa-regular fa-bookmark mx-3'
        ? addToFavourites(btn.id)
        : removeFavourite(btn.id);
    });
  });
}

function showSavedConcerts() {
  const concertsContainer = document.getElementById('events-container');
  let favourites = JSON.parse(localStorage.getItem('favourites'));
  let bookmarkIconClass;

  concertsContainer.innerHTML = '';
  Object.values(favourites).forEach((savedConcert) => {
    bookmarkIconClass = favourites[savedConcert.link]
      ? 'fa-solid fa-bookmark mx-3'
      : 'fa-regular fa-bookmark mx-3';
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
            savedConcert.link + 'icon'
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

  addButtonListeners(document.getElementsByClassName('remove-btn'));

  document.getElementById('toggle-favs-text').innerHTML = 'Show All Concerts';
  document.getElementById('toggle-favs-btn').addEventListener('click', () => {
    showAllConcerts(concerts);
  });
}

async function getArtistGenre(artistAPIUrl) {
  let accessToken = localStorage.getItem('access_token');

  return fetch(artistAPIUrl, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  })
    .then((res) => res.json())
    .then((artistInfo) => {
      return artistInfo.genres;
    });
}

function showAllConcerts(arr) {
  const concertsContainer = document.getElementById('events-container');
  const favourites = JSON.parse(localStorage.getItem('favourites')) || {};
  const bookmarkButtonArr = document.getElementsByClassName('save-btn');

  concertsContainer.innerHTML = '';
  // Create concert information component from fetched data
  arr.forEach((concert) => {
    let bookmarkIconClass = favourites[concert.link]
      ? 'fa-solid fa-bookmark mx-3'
      : 'fa-regular fa-bookmark mx-3';
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full">
    <div class="flex-col">
      <h4 class="mb-2 font-semibold">${concert.name}</h4>
      <p>${concert.date.toDateString()} @ ${concert.time}</p>
    </div>
    <div class="flex">
      <!-- Save to Favourites -->
      <button id="${concert.link}" class="save-btn" type="button">
        <i id="${concert.link + 'icon'}" class="${bookmarkIconClass}"></i>
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

  document.getElementById('toggle-favs-text').innerHTML = 'Show Saved Concerts';
  document.getElementById('toggle-favs-btn').addEventListener('click', () => {
    showSavedConcerts(concerts);
  });
}

export {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
  getArtistGenre,
  showSavedConcerts,
  showAllConcerts,
  setShuffle,
  setRepeat,
  debounce,
  getMinAndSec,
};
