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
    console.log(data)
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

export { getProfile, getSearch, getEvents, getUserPlaylist, debounce };
