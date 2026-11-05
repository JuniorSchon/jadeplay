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
          <time>${fmtDate(h.date)}</time>
          <ul>${(h.notes || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        </div>`).join('') +
        (v.certSha256 ? `<p class="sub" style="margin-top:8px">Impressão digital (SHA-256) do certificado de assinatura:<br><span class="mono">${esc(v.certSha256)}</span></p>` : '');
    })
    .catch(() => {
      $('#install-version').textContent = 'veja a página de Releases';
      $('#changelog').innerHTML = '<p class="sub">Não foi possível carregar o histórico agora.</p>';
    });
})();
