const repo = "finance-data";
const filePath = "data.json";

async function getData() {
  const token = localStorage.getItem("gh_token");
  const username = localStorage.getItem("gh_username");

  const res = await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    }
  );

  const data = await res.json();
  const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
  return { content, sha: data.sha };
}

async function updateData(newData, sha) {
  const token = localStorage.getItem("gh_token");
  const username = localStorage.getItem("gh_username");

  await fetch(
    `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Update finance data",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2)))),
        sha: sha
      })
    }
  );
}