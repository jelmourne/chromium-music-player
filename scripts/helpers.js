import { concertsArr, concertsContainer } from './app';

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
    type: 'track',
    limit: 5,
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

  const response = await fetch(
    `https://api.spotify.com/v1/users/${await getProfile().id}/playlists`,
    {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );

  return await response.json();
}

// Function that calls ticketmaster API to fetch events in the users country. It takes the user's
// country as an argument and returns an array of events. The function will loop through the fetched
// data and store the name, date, time, url, and image of the event. Duplicate tours in different cities will be ignored.

async function getEvents(userCountry) {
  const rootURL = 'https://app.ticketmaster.com/discovery/v2/';
  const apiKey = 'MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V';

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
  let favourites = JSON.parse(localStorage.getItem('favourites')) || {};
  concertsArr.forEach((concert) => {
    if (concert.link.includes(concertUrl)) {
      favourites[concertUrl] = concert;
      localStorage.setItem('favourites', JSON.stringify(favourites));
      let savedIcon = document.getElementById(concertUrl + 'icon');
      savedIcon.className = 'fa-solid fa-bookmark mx-3';
    }
  });
  alert('Concert bookmarked :-)');
}

// Remove concert from favourites (local storage)
function removeFavourite(concertUrl) {
  if (favourites[concertUrl]) {
    delete favourites[concertUrl];
    localStorage.setItem('favouriteImages', JSON.stringify(favourites));
  }
}

function showSavedConcerts() {
  concertsContainer.innerHTML = '';
  let favourites = JSON.parse(localStorage.getItem('favourites'));

  Object.values(favourites).forEach((savedConcert) => {
    let bookmarkIconClass = favourites[savedConcert.link] ? "fa-solid fa-bookmark mx-3" : "fa-regular fa-bookmark mx-3";
    concertsContainer.innerHTML += `<div class="flex items-center justify-between gap-x-4 border-b-2 pb-5 pt-5 w-full">
      <div class="flex-col">
        <h4 class="mb-2 font-semibold">${savedConcert.name}</h4>
        <p>${new Date(savedConcert.date).toDateString()} @ ${savedConcert.time}</p>
      </div>
      <div class="flex">
        <!-- Save to Favourites -->
        <button id="${savedConcert.link}" class="save-btn" type="button">
          <i class="${bookmarkIconClass}"></i>
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
}

export {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
  addToFavourites,
  removeFavourite,
  showSavedConcerts,
  debounce,
};
