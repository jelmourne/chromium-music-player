import { authorization } from './authentication.js';
import {
  getProfile,
  getSearch,
  getEvents,
  getUserPlaylist,
  getArtistGenre,
  showSavedConcerts,
  showAllConcerts,
  debounce,
  getMinAndSec,
  setShuffle,
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

// Spotify player
var tag = document.createElement('script');
tag.src = 'https://sdk.scdn.co/spotify-player.js';
document.getElementsByTagName('body')[0].appendChild(tag);

const playButton = document.getElementById('togglePlay');
const duration = document.getElementById('song-duration');
const currentTime = document.getElementById('currTime');

// Initializing Web Playback SDK with event listeners
let genre;
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = localStorage.getItem('access_token');
  const player = new Spotify.Player({
    name: 'Chrome Extension',
    volume: 0.3,
    getOAuthToken: (cb) => {
      cb(token);
    },
  });

  player.addListener('ready', ({ device_id }) => {
    // const connect_to_device = () => {
    const accessToken = localStorage.getItem('access_token');
    console.log('Changing to device');
    let changeDevice = fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [device_id],
        play: false,
      }),
      headers: new Headers({
        Authorization: 'Bearer ' + accessToken,
      }),
    });
  });
  // connect_to_device();
  //});

  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  player.addListener('authentication_error', ({ message }) => {
    console.error(message);
  });

  player.addListener('account_error', ({ message }) => {
    console.error(message);
  });

  player.connect().then((success) => {
    if (success) {
      console.log('The Web Playback SDK successfully connected to Spotify!');
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
        currentTime.innerHTML = '0:00';
      }
    }, 1000);
  }

  player.on('player_state_changed', async (state) => {
    let startTime = new Date(state.position);
    let endTime = new Date(state.duration);

    if (!timer) {
      playbackTimer(startTime, endTime);
    } else {
      clearInterval(timer);
      playbackTimer(startTime, endTime);
    }

    if (!state.paused) {
      playButton.classList.add('fa-circle-pause');
      playButton.classList.add('fa-solid');
    } else {
      playButton.classList.remove('fa-circle-pause');
      playButton.classList.remove('fa-solid');

      clearInterval(timer);
    }

    document.getElementById('current-song-name').innerHTML =
      state.track_window.current_track.name;

    document.getElementById('current-song-img').src =
      state.track_window.current_track.album.images[0].url;

    document.getElementById('current-song-artist').innerHTML =
      state.track_window.current_track.artists[0].name;

    currentTime.innerHTML = getMinAndSec(state.position);
    document.getElementById('endTime').innerHTML = getMinAndSec(state.duration);

    duration.max = endTime;
    duration.value = startTime;

    filterConcertsByGenre(state.track_window.current_track.artists[0].url);
  });

  // Toggle play
  playButton.onclick = function () {
    player.togglePlay();
  };

  document.getElementById('prevTrack').onclick = function () {
    player.previousTrack();
  };

  document.getElementById('nextTrack').onclick = function () {
    player.nextTrack();
  };
};

const shufflePlay = document.getElementById('randomTrack');
shufflePlay.addEventListener('click', () => {
  let params = document.getElementById('randomValue');
  setShuffle(params.value);
  if (params.value == 'true') {
    params.value = 'false';
  } else {
    params.value = 'true';
  }
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
        class="flex w-auto bg-white p-2 hover:bg-green-500 hover:text-white transition-all cursor-pointer" onclick="playSong('${
          element.uri
        }')"
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

if (playlist.total != 0) {
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
} else {
  playlistResult.innerHTML =
    "<li class='flex w-auto bg-white p-1 m-6'>No Playlist Available</li>";
}

let concerts;
async function filterConcertsByGenre(artistUrl) {
  genre = await getArtistGenre(artistUrl);
  concerts = await getEvents(profile.country, genre);
  showAllConcerts(concerts);
}

const concertToggle = document.getElementById('concertToggle')

concertToggle.addEventListener('change', () => {
  if (document.getElementById('events-container')) {
    document.getElementById('events-container').remove();
  } else {
    let eventsContainer = document.createElement('div')
    eventsContainer.id = 'events-container';
    eventsContainer.className = 'flex flex-col items-center justify-center overflow-auto h-96';
    console.log(eventsContainer)
    document.getElementById('player-container').appendChild(eventsContainer);
    showAllConcerts(concerts)
  }
  // document.getElementById('events-container').classList.toggle('invisible')
});

export { concerts };
