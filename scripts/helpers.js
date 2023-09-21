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
  
  // Function that calls ticketmaster API to fetch events and returns the events as an array
  async function getEvents() {
    const userProfile = await getProfile();
    const rootURL = "https://app.ticketmaster.com/discovery/v2/";
    const apiKey = "MXLBwKzlHC8GwQe6qv9gdnCw2oWr7N3V";
  
    const response = await fetch(
      `${rootURL}events.json?classificationName=music&apikey=${apiKey}&countryCode=${userProfile.country}`
    );
    const data = await response.json();
    let events = data._embedded.events;
  
    return await events;
  }

export { getProfile, getSearch, getEvents }
  