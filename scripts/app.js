import { authorization } from './authentication.js';
import {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
  showSavedConcerts,
  showAllConcerts,
  debounce,
} from './helpers.js';

/* 
// Check if user is logged in and change profile icon
const profileSection = document.getElementById("profile");

localStorage.getItem("access_token") == null
  ? (profileSection.innerHTML = `
<button
id="login-button"
type="button"
>
<i class="fa-brands fa-spotify mx-3"></i>
</button>`)
  : (profileSection.innerHTML = `<button
data-dropdown-toggle="account-dropdown"
type="button"
id="profile-button"
>
<i class="fa-solid fa-user mx-3"></i>
</button>`);

*/

// Declaring consts
const profile = await getProfile();
const playlist = await getUserPlaylist();

// Loading dropdown scripts
var tag = document.createElement('script');
tag.src = 'https://unpkg.com/flowbite@1.5.1/dist/flowbite.js';
document.getElementsByTagName('head')[0].appendChild(tag);

// DOM Manipulation Section
try {
  document
    .getElementById('login-button')
    .addEventListener('click', authorization);
} catch (ex) {
  alert(ex);
}

document.getElementById('profile-name').innerHTML =
  'Hi, ' + profile.display_name;

document.getElementById('profile-followers').innerHTML =
  profile.followers.total + ' Followers';

document.getElementById('toggle-favs-btn').addEventListener('click', () => {
  showSavedConcerts();
});

document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('access_token');
  location.reload();
});



// Modifies dom with search results from searchbox
const search = document.getElementById('song-search');
const searchResults = document.getElementById('search-result');

search.addEventListener(
  'input',
  debounce(() => {
    searchResults.innerHTML = '';
    getSearch(search.value).then((response) => {
      response.tracks.items.forEach((element) => {
        searchResults.innerHTML += `<hr><li
        class="flex w-auto bg-white p-2 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
      >
      
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
            <p class="text-lg me-2">${
              element.explicit == true ? '&#127348' : ''
            }</p>
            <p>${element.artists[0].name}</p>
          </div>
        </div>
      </li>`;
      });
    });
  }, 300)
);

// Gets all users playlist and renders them on the page
const playlistResult = document.getElementById('playlist-dropdown');

playlist.items.forEach((element) => {
  playlistResult.innerHTML += `<hr><li
        class="flex w-auto bg-white p-1 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
      >
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
            <p>&nbsp ${
              element.owner.display_name == 'undefined'
                ? ''
                : element.owner.display_name
            }</p>
          </div>
        </div>
      </li>`;
});

// Fetch and show concerts
let concertsArr = await getEvents(profile.country);
showAllConcerts(concertsArr);



export { concertsArr };
