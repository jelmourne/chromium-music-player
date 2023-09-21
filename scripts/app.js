import { authorization } from "./authentication.js";
import { getProfile, getSearch, getEvents } from "./helpers.js";

const profile = await getProfile();

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
