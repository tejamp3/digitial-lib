const form = document.getElementById("uploadForm");
const list = document.getElementById("resourceList");

async function loadResources() {
  const res = await fetch("/api/resources");
  const data = await res.json();
  list.innerHTML = "";
  data.forEach((r) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${r.title}</strong> (${r.type}) - <a href="${r.url}" target="_blank">Open</a>`;
    list.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const type = document.getElementById("type").value;
  const url = document.getElementById("url").value;

  await fetch("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, type, url }),
  });

  form.reset();
  loadResources();
});

loadResources();
