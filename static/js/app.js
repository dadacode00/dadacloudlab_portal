const DATA_URL = "/data/services.json";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const serviceButton = (service) => {
  if (Array.isArray(service.downloads) && service.downloads.length > 0) {
    return service.downloads
      .filter((download) => download && download.platform && download.url)
      .map(
        (download) => `
      <a class="button primary" href="${escapeHtml(download.url)}" target="_blank" rel="noopener">
        Download for ${escapeHtml(download.platform)}
      </a>
    `,
      )
      .join("");
  }

  if (service.download_url) {
    return `
      <a class="button primary" href="${escapeHtml(service.download_url)}" target="_blank" rel="noopener">
        Download for macOS
      </a>
    `;
  }

  if (!service.service_url) {
    return '<span class="button disabled" aria-disabled="true">서비스 바로가기</span>';
  }

  return `
    <a class="button primary" href="${escapeHtml(service.service_url)}" target="_blank" rel="noopener">
      서비스 바로가기
    </a>
  `;
};

const productCard = (service) => `
  <article class="product-card">
    <a href="${escapeHtml(service.detail_url)}">
      <img class="product-thumbnail" src="${escapeHtml(service.thumbnail)}" alt="${escapeHtml(service.name)}">
    </a>
    <div class="product-card-body">
      <div class="product-card-meta-header">
        <a class="product-card-meta-title" href="${escapeHtml(service.detail_url)}">
          0${service.order} / ${escapeHtml(service.name)}
        </a>
        ${service.status ? `<span class="status">${escapeHtml(service.status)}</span>` : ""}
      </div>
      <div class="product-card-meta-desc">
        ${escapeHtml(service.tagline)}
      </div>
    </div>
    <div class="product-card-actions">
      <a class="button" href="${escapeHtml(service.detail_url)}">상세보기</a>
      ${serviceButton(service)}
    </div>
  </article>
`;

// CDN을 통해 marked 라이브러리를 동적 로드하여 마크다운을 HTML로 파싱하는 함수
const convertMarkdownToHtml = async (markdown) => {
  if (typeof marked === "undefined") {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load marked library"));
      document.head.appendChild(script);
    });
  }
  return marked.parse(markdown, {
    breaks: true, // 엔터 한 번으로 줄바꿈(<br>)이 되도록 설정
    gfm: true     // GitHub Flavored Markdown 활성화
  });
};

const loadServices = async () => {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error("Unable to load services.json");
  }

  return (await response.json()).sort((a, b) => a.order - b.order);
};

const renderServiceLists = async () => {
  const containers = document.querySelectorAll("[data-services-list]");
  if (containers.length === 0) {
    return;
  }

  const services = await loadServices();
  const cards = services.map(productCard).join("");
  containers.forEach((container) => {
    container.innerHTML = cards;
  });
};

const renderServiceDetail = async () => {
  const detailRoot = document.querySelector("[data-service-detail]");
  const slug = document.body.dataset.serviceSlug;

  if (!detailRoot || !slug) {
    return;
  }

  const services = await loadServices();
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    detailRoot.innerHTML = `
      <section class="not-found">
        <p class="eyebrow">404</p>
        <h1>Service not found</h1>
        <a class="button primary" href="/services/">Products</a>
      </section>
    `;
    return;
  }

  const markdownResponse = await fetch(`/content/services/${slug}.md`);
  const markdown = markdownResponse.ok ? await markdownResponse.text() : "# Service\n\nContent is not available yet.";

  let htmlContent = "";
  try {
    htmlContent = await convertMarkdownToHtml(markdown);
  } catch (error) {
    console.error(error);
    // 실패 시 일반 텍스트로 처리
    htmlContent = `<pre>${escapeHtml(markdown)}</pre>`;
  }

  detailRoot.innerHTML = `
    <article class="detail-layout">
      <aside class="detail-aside">
        <img class="detail-thumbnail" src="${escapeHtml(service.thumbnail)}" alt="">
        <div class="service-meta">
          <span class="status">${escapeHtml(service.status)}</span>
          <h1>${escapeHtml(service.name)}</h1>
          <p>${escapeHtml(service.tagline)}</p>
        </div>
        <div class="detail-actions">
          <a class="button" href="/services/">Products</a>
          ${serviceButton(service)}
        </div>
      </aside>
      <div class="markdown-body">${htmlContent}</div>
    </article>
  `;
};

renderServiceLists().catch((error) => console.error(error));
renderServiceDetail().catch((error) => console.error(error));

const initTabSwitcher = () => {
  const triggers = document.querySelectorAll(".tab-trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = trigger.dataset.target;

      // 모든 트리거 비활성화
      triggers.forEach((t) => t.classList.remove("active"));
      trigger.classList.add("active");

      // 모든 콘텐츠 비활성화
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // 선택한 콘텐츠 활성화
      const activeContent = document.getElementById(`tab-${target}`);
      if (activeContent) {
        activeContent.classList.add("active");
      }
    });
  });
};

initTabSwitcher();
