document.getElementById("year").textContent = new Date().getFullYear();

fetch("/api/public/content.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Content API returned ${response.status}`);
    return response.json();
  })
  .then(({ writings }) => {
    const item = writings?.find((entry) => entry.featured) || writings?.[0];
    if (!item) return;
    document.getElementById("featured-writing-link").href = `/writing/${encodeURIComponent(item.slug)}`;
    document.getElementById("featured-writing-title").textContent = item.title;
    document.getElementById("featured-writing-summary").textContent = item.summary;
    document.getElementById("featured-writing-category").textContent = item.category;
    const time = document.getElementById("featured-writing-date");
    time.dateTime = item.publishedAt;
    time.textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit" }).format(new Date(item.publishedAt));
  })
  .catch((error) => console.warn("Neverland content could not be loaded", error));

fetch("/api/public/github.json")
  .then((response) => response.json())
  .then((github) => {
    const target = document.getElementById("github-content");
    if (!github) {
      target.innerHTML = "<p>GitHub 공개 활동을 준비하고 있습니다.</p>";
      return;
    }
    const repos = github.repositories.slice(0, 3).map((repo) => {
      const link = document.createElement("a");
      link.href = repo.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "github-repo";
      const name = document.createElement("strong");
      name.textContent = repo.name;
      const meta = document.createElement("span");
      meta.textContent = [repo.language, repo.stars ? `★ ${repo.stars}` : ""].filter(Boolean).join(" · ");
      link.append(name, meta);
      return link;
    });
    target.replaceChildren(...repos);
    const profile = document.createElement("a");
    profile.href = github.profileUrl;
    profile.target = "_blank";
    profile.rel = "noopener noreferrer";
    profile.className = "github-profile";
    profile.textContent = `@${github.username} 전체 보기 ↗`;
    target.append(profile);
  })
  .catch(() => {
    document.getElementById("github-content").innerHTML = "<p>GitHub 공개 활동을 준비하고 있습니다.</p>";
  });
