// Preenche a página com os dados da versão atual (version.json, atualizado pelo script de publicação).
(function () {
  const $ = (s) => document.querySelector(s);
  const fmtDate = (iso) => {
    try { return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  };
  const fmtSize = (bytes) => (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  $('#year').textContent = new Date().getFullYear();

  // Abas de instalação
  document.querySelectorAll('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== btn.dataset.tab; });
    });
  });

  // Contagem de downloads: o GitHub registra quantas vezes cada APK das Releases foi baixado.
  const downloadsByCode = {};
  const fmtNum = (n) => n.toLocaleString('pt-BR');
  const showCounts = () => {
    document.querySelectorAll('[data-dl-code]').forEach((el) => {
      const n = downloadsByCode[el.dataset.dlCode];
      if (n !== undefined) el.textContent = `⬇ ${fmtNum(n)} download${n === 1 ? '' : 's'}`;
    });
  };
  fetch('https://api.github.com/repos/JuniorSchon/jadeplay/releases?per_page=100')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((releases) => {
      let total = 0;
      releases.forEach((rel) => {
        const n = (rel.assets || [])
          .filter((a) => a.name.toLowerCase().endsWith('.apk'))
          .reduce((sum, a) => sum + a.download_count, 0);
        total += n;
        const m = /-(\d+)$/.exec(rel.tag_name || ''); // tag "v1.0-4" -> versionCode 4
        if (m) downloadsByCode[m[1]] = (downloadsByCode[m[1]] || 0) + n;
      });
      $('#downloads-total').textContent = fmtNum(total);
      $('#downloads').hidden = false;
      showCounts();
    })
    .catch(() => { /* sem contagem (ex.: limite da API atingido): a página funciona normalmente */ });

  fetch('version.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((v) => {
      const url = v.latestUrl || v.url;
      document.querySelectorAll('.download-link').forEach((a) => { a.href = url; });
      $('#release-meta').innerHTML =
        `Versão <strong>${esc(v.versionName)} (${esc(v.versionCode)})</strong> • ${fmtDate(v.date)} • ${fmtSize(v.size)} • Android ${esc(v.minAndroid)} ou superior`;
      $('#install-version').textContent = `${v.versionName} (${v.versionCode}), de ${fmtDate(v.date)}`;
      $('#tv-url').textContent = v.shortUrl || url;

      const history = v.history && v.history.length ? v.history : [v];
      $('#changelog').innerHTML = history.map((h, i) => `
        <div class="entry">
          <h3>Versão ${esc(h.versionName)} (${esc(h.versionCode)})${i === 0 ? '<span class="badge">ATUAL</span>' : ''}</h3>
          <time>${fmtDate(h.date)}</time><span class="dl-count" data-dl-code="${esc(h.versionCode)}"></span>
          <ul>${(h.notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        </div>`).join('') +
        (v.certSha256 ? `<p class="sub" style="margin-top:8px">Impressão digital (SHA-256) do certificado de assinatura:<br><span class="mono">${esc(v.certSha256)}</span></p>` : '');
      showCounts(); // caso a contagem tenha chegado antes do histórico
    })
    .catch(() => {
      $('#install-version').textContent = 'veja a página de Releases';
      $('#changelog').innerHTML = '<p class="sub">Não foi possível carregar o histórico agora.</p>';
    });
})();
