function saveCredentials(token, username) {
  localStorage.setItem("gh_token", token);
  localStorage.setItem("gh_username", username);
}

function getCredentials() {
  return {
    token: localStorage.getItem("gh_token"),
    username: localStorage.getItem("gh_username")
  };
}