function generateRandomString(length) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeVerify(codeVerify) {
  function base64Encode(string) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  const encode = new TextEncoder();
  const data = encode.encode(codeVerify);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  return base64Encode(digest);
}

function authorization() {
  const clientId = "989fcac77492492eb7094a755c3be267";
  const redirectUri = "http://127.0.0.1:3000/main.html";
  let codeVerify = generateRandomString(128);

  generateCodeVerify(codeVerify).then((codeChallenge) => {
    let state = generateRandomString(16);
    let scope =
      "streaming user-modify-playback-state user-read-currently-playing playlist-read-private user-read-email user-read-private";

    localStorage.setItem("code_verifier", codeVerify);

    let args = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

    window.location = "https://accounts.spotify.com/authorize?" + args;
  });

  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get("code");
  let codeVerifier = localStorage.getItem("code_verifier");

  let body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP status " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      localStorage.setItem("access_token", data.access_token);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function getProfile() {
  let accessToken = localStorage.getItem("access_token");

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  return await response.json();
}

async function getSearch(Query) {
  let accessToken = localStorage.getItem("access_token");

  let args = new URLSearchParams({
    q: Query,
    type: "track",
    limit: 5,
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${args}`, {
    header: {
      Authorization: "Bearer " + accessToken,
    },
  });
  return await response.json();
}

document
  .getElementById("login-button")
  .addEventListener("click", authorization);

console.log(await getSearch("drake"));
