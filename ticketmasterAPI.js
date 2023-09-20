// Calls ticketmaster API to fetch events and returns the events as an array
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