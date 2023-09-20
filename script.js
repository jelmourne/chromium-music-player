import env from "dotenv";
env.config();

const clientId = process.env.clientId;
const redirectUri = "https://localhost:5173";

let codeVerify = generateRandomString(128);

generateCodeVerify(codeVerify).then((codeChallenge) => {
  let state = generateRandomString(16);
  let scope =
    "streaming user-modify-playback-state user-read-currently-playing playlist-read-private user-read-email";

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
