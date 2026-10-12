document.getElementById("year").textContent = new Date().getFullYear();

const TAG_LABELS = {
  "spring-boot": "Spring Boot", spring: "Spring", "react-native": "React Native", react: "React", nextjs: "Next.js",
  postgresql: "PostgreSQL", mybatis: "MyBatis", plsql: "PL/SQL", "apache-poi": "Apache POI", "kendo-ui": "Kendo UI",
  egovframe: "eGovFrame", typescript: "TypeScript", javascript: "JavaScript", nodejs: "Node.js", sftp: "SFTP",
  etl: "ETL", aws: "AWS", ai: "AI", mssql: "MSSQL", expo: "Expo", kafka: "Kafka", java: "Java", oracle: "Oracle",
  iframe: "iFrame", thymeleaf: "Thymeleaf", docker: "Docker", caddy: "Caddy", outline: "Outline",
};
const tagLabel = (tag) => TAG_LABELS[tag] || tag.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function periodNode(period) {
  const span = el("span", "proj-period");
  const match = period.match(/^(.*?)\s*[—–-]\s*(Present)$/i);
  if (match) {
    span.append(`${match[1]} — `, el("b", "", "Present"));
  } else {
    span.textContent = period;
  }
  return span;
}

function projectRow(project) {
  const row = el("a", "proj-row");
  row.href = `/projects/${encodeURIComponent(project.slug)}`;
  const main = el("span", "proj-main");
  main.append(el("strong", "", project.title), el("span", "", project.summary));
  row.append(periodNode(project.period || ""), main, el("span", "proj-tags", (project.tags || []).slice(0, 3).map(tagLabel).join(" · ")));
  return row;
}

function noteRow(item) {
  const row = el("a", "note-row");
  row.href = `/writing/${encodeURIComponent(item.slug)}`;
  const date = new Date(item.publishedAt);
  const time = el("time", "", `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`);
  time.dateTime = item.publishedAt;
  const main = el("span", "proj-main");
  main.append(el("strong", "", item.title), el("span", "", item.summary));
  row.append(time, main);
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
      document.getElementById("project-list").replaceChildren(...featured.map(projectRow));
      document.getElementById("projects-all").textContent = `전체 ${projects.length}개 보기 →`;
    }
    if (writings.length) {
      document.getElementById("note-list").replaceChildren(...writings.slice(0, 4).map(noteRow));
    }
  })
  .catch((error) => console.warn("Neverland content could not be loaded", error));
