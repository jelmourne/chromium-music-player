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

// Function that calls ticketmaster API to fetch events in the users country. The function will loop
// through the fetched data and store the name, date, time, url, and image of the event. Duplicate tours
// in different cities will be ignored, only 1 tour date per tour will be displayed.

async function getEvents(userCountry) {
  const rootURL = "https://app.ticketmaster.com/discovery/v2/";
  const apiKey = "MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V";

  const response = await fetch(
    `${rootURL}events.json?classificationName=music&apikey=${apiKey}&countryCode=${userCountry}`
  );
  const data = await response.json();

  let fetchedEvents = data._embedded.events;
  let filteredEvents = [];
  for (let i = 0; i < fetchedEvents.length; i++) {
    let event = {
      name: fetchedEvents[i].name,
      date: fetchedEvents[i].dates.start.localDate,
      time: fetchedEvents[i].dates.start.localTime,
      link: fetchedEvents[i].url,
      image: fetchedEvents[i].images[0].url,
      genre: fetchedEvents[i].classifications[0].genre.name,
    };

    if (i > 0) {
      if (filteredEvents[filteredEvents.length - 1].name.includes(event.name.substr(0, 5))) {
        continue;
      }
    }
    filteredEvents.push(event);
  }

  return filteredEvents;
}

export { getProfile, getSearch, getEvents };
