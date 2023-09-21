import { authorization } from "./authentication.js";
import {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
} from "./helpers.js";

const profile = await getProfile();
const playlist = await getUserPlaylist();

// DOM Manipulation Section
document
  .getElementById("login-button")
  .addEventListener("click", authorization);

// document.getElementById("profile").addEventListener("click", () => {
//   const dropdown = document.getElementById("account-dropdown");
//   return localStorage.getItem("access_token") == null ? authorization() : ds
// });

document.getElementById("logout-button").addEventListener("click", () => {
  localStorage.removeItem("access_token");
  location.reload();
});

const userProfileName = document.getElementById("profile-name");

localStorage.getItem("access_token") == null
  ? (userProfileName.innerHTML = " ")
  : (userProfileName.innerHTML = "Hi, " + profile.display_name);

document.getElementById("profile-followers").innerHTML =
  profile.followers.total + " Followers";

const search = document.getElementById("song-search");
const searchResults = document.getElementById("search-result");

search.addEventListener("input", () => {
  getSearch(search.value).then((response) => {
    response.tracks.items.forEach((element) => {
      searchResults.innerHTML = `<div
      class="flex w-auto bg-white p-1 hover:bg-green-500 hover:text-white transition-all my-2"
    >
      <div class="flex flex-col">
        <img
          src="${element.album.images[0].url}"
          class="h-14 aspect-square"
        />
      </div>
      <div class="flex flex-col mx-3">
        <h1 class="text-lg">${element.name}</h1>
        <div class="flex flex-row">
          <p class="text-lg me-2">${
            element.explicit == true ? "&#127348" : ""
          }</p>
          <p>${element.artists[0].name}</p>
        </div>
      </div>
    </div>`;
    });
  });
});

const playlistResult = document.getElementById("playlist-results");

playlist.items.forEach((element) => {
  console.log(playlist);
  playlistResult.innerHTML += `<li
        class="flex w-auto bg-white p-1 hover:bg-green-500 hover:text-white transition-all my-2"
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
              element.owner.display_name == "undefined"
                ? ""
                : element.owner.display_name
            }</p>
          </div>
        </div>
      </li>`;
});
