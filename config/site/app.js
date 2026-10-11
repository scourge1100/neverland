document.getElementById("year").textContent = new Date().getFullYear();

const TAG_LABELS = {
  "spring-boot": "Spring Boot", spring: "Spring", "react-native": "React Native", react: "React", nextjs: "Next.js",
  postgresql: "PostgreSQL", mybatis: "MyBatis", plsql: "PL/SQL", "apache-poi": "Apache POI", "kendo-ui": "Kendo UI",
  egovframe: "eGovFrame", typescript: "TypeScript", javascript: "JavaScript", nodejs: "Node.js", sftp: "SFTP",
  etl: "ETL", aws: "AWS", ai: "AI", mssql: "MSSQL", expo: "Expo", kafka: "Kafka", java: "Java", oracle: "Oracle",
  iframe: "iFrame", thymeleaf: "Thymeleaf",
};
const tagLabel = (tag) => TAG_LABELS[tag] || tag.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function periodNode(period) {
  const span = el("span", "pcard-period");
  const match = period.match(/^(.*?)(?:\s*[—–-]\s*)(Present)$/i);
  if (match) {
    span.append(`${match[1]} — `);
    span.append(el("i", "live", "Present"));
  } else {
    span.textContent = period;
  }
  return span;
}

function projectCard(project, index, lead) {
  const [main, ...rest] = project.title.split(" — ");
  const card = el("a", `pcard${lead ? " pcard-lead" : ""}`);
  card.href = `/projects/${encodeURIComponent(project.slug)}`;
  card.dataset.no = String(index + 1).padStart(2, "0");

  const top = el("div", "pcard-top");
  top.append(el("span", "pcard-no", String(index + 1).padStart(2, "0")), periodNode(project.period || ""));

  const title = el("h3", /^[\x00-\x7f]+$/.test(main) ? "latin" : "", main);
  card.append(top, el("p", "pcard-kicker", project.category), title);
  if (rest.length) card.append(el("p", "pcard-sub", rest.join(" — ")));
  card.append(el("p", "pcard-summary", project.summary));
  if (project.tags?.length) {
    const list = el("ul");
    list.setAttribute("aria-label", "사용 기술");
    project.tags.slice(0, lead ? 6 : 4).forEach((tag) => list.append(el("li", "", tagLabel(tag))));
    card.append(list);
  }
  const go = el("span", "pcard-go", "View case ");
  go.append(el("span", "", "↗"));
  go.lastChild.setAttribute("aria-hidden", "true");
  card.append(go);
  card.addEventListener("pointermove", (event) => {
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - box.left}px`);
    card.style.setProperty("--my", `${event.clientY - box.top}px`);
  });
  return card;
}

function noteRow(item) {
  const row = el("a", "note-row");
  row.href = `/writing/${encodeURIComponent(item.slug)}`;
  const time = el("time", "", new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit" }).format(new Date(item.publishedAt)).replace(/\.\s*/g, ".").replace(/\.$/, ""));
  time.dateTime = item.publishedAt;
  const body = el("div");
  body.append(el("p", "note-cat", item.category), el("h3", "", item.title), el("p", "", item.summary));
  const arrow = el("span", "arrow", "↗");
  arrow.setAttribute("aria-hidden", "true");
  row.append(time, body, arrow);
  return row;
}

fetch("/api/public/content.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Content API returned ${response.status}`);
    return response.json();
  })
  .then(({ writings = [], projects = [] }) => {
    const featured = projects.filter((project) => project.featured).slice(0, 8);
    if (featured.length) {
      const grid = document.getElementById("project-grid");
      const all = el("a", "pcard pcard-all");
      all.href = "/projects";
      all.append(el("p", "pcard-kicker", "Archive"), el("h3", "", `모든 프로젝트 ${projects.length}`));
      const go = el("span", "pcard-go", "View all ");
      go.append(el("span", "", "↗"));
      all.append(go);
      grid.replaceChildren(...featured.map((project, index) => projectCard(project, index, index === 0)), all);
    }

    if (writings.length) {
      document.getElementById("note-list").replaceChildren(...writings.slice(0, 4).map(noteRow));
    }

    document.getElementById("stat-projects").textContent = String(featured.length || projects.length);
    document.getElementById("stat-notes").textContent = String(writings.length);
    const latest = [...writings, ...projects].map((item) => new Date(item.updatedAt || item.publishedAt)).sort((a, b) => b - a)[0];
    if (latest) {
      document.getElementById("stat-updated").textContent = `${latest.getFullYear()}.${String(latest.getMonth() + 1).padStart(2, "0")}`;
    }
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
