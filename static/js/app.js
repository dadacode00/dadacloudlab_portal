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
