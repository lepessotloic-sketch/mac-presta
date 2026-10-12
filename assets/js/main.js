/* MAC PRESTA — Essentiel : menu, questions, demande de date (envoi réel par e-mail à Mickael) */
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  // Menu mobile
  const toggle = $('.nav-toggle'), links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => { const o = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); } });
    // lien de la partie en cours
    const liens = [...links.querySelectorAll('a')], cibles = liens.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const marque = () => { const y = scrollY + innerHeight * .35; let c = null; cibles.forEach(x => { if (x.getBoundingClientRect().top + scrollY <= y) c = x; }); liens.forEach(l => l.classList.toggle('actif', !!c && l.getAttribute('href') === '#' + c.id)); };
    marque(); addEventListener('scroll', marque, { passive: true });
  }

  // Questions en accordéon
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question'), a = item.querySelector('.faq-answer');
    q.setAttribute('role', 'button'); q.setAttribute('tabindex', '0');
    const bascule = () => {
      const ouvert = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => { if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-answer').style.maxHeight = null; } });
      item.classList.toggle('open', !ouvert); a.style.maxHeight = ouvert ? null : a.scrollHeight + 'px';
    };
    q.addEventListener('click', bascule);
    q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bascule(); } });
  });

  // Listes déroulantes aux couleurs du site (le <select> reste dessous : c'est lui qui porte la valeur)
  document.querySelectorAll('#demande-form select').forEach(sel => {
    const box = document.createElement('div'); box.className = 'choix'; sel.parentNode.insertBefore(box, sel); box.appendChild(sel);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'choix-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const lab = document.querySelector('label[for="' + sel.id + '"]'); if (lab) { btn.id = sel.id + '-btn'; btn.setAttribute('aria-label', lab.textContent); lab.addEventListener('click', e => { e.preventDefault(); btn.focus(); }); }
    const ul = document.createElement('ul'); ul.setAttribute('role', 'listbox'); sel.tabIndex = -1;
    const opts = [...sel.options]; let f = sel.selectedIndex;
    const marque = () => [...ul.children].forEach((li, i) => { li.classList.toggle('focus', i === f); li.setAttribute('aria-selected', i === sel.selectedIndex); });
    const choisir = (i, muet) => { sel.selectedIndex = i; btn.textContent = opts[i].text; if (!muet) sel.dispatchEvent(new Event('change', { bubbles: true })); marque(); };
    const ouvrir = () => { box.classList.add('ouvert'); btn.setAttribute('aria-expanded', 'true'); f = sel.selectedIndex; marque(); };
    const fermer = () => { box.classList.remove('ouvert'); btn.setAttribute('aria-expanded', 'false'); };
    opts.forEach((o, i) => { const li = document.createElement('li'); li.setAttribute('role', 'option'); li.textContent = o.text; li.addEventListener('click', () => { choisir(i); fermer(); btn.focus(); }); li.addEventListener('mouseenter', () => { f = i; marque(); }); ul.appendChild(li); });
    box.append(btn, ul);
    btn.addEventListener('click', () => box.classList.contains('ouvert') ? fermer() : ouvrir());
    btn.addEventListener('keydown', e => { const o = box.classList.contains('ouvert');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!o) return ouvrir(); f = (f + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; marque(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (o) { choisir(f); fermer(); } else ouvrir(); }
      else if (e.key === 'Escape') fermer(); });
    document.addEventListener('click', e => { if (!box.contains(e.target)) fermer(); });
    sel.form.addEventListener('reset', () => setTimeout(() => choisir(sel.selectedIndex, true)));
    choisir(sel.selectedIndex, true);
  });

  // Demande de date
  const form = $('#demande-form');
  const demain = new Date(); demain.setDate(demain.getDate() + 1);
  const min = demain.getFullYear() + '-' + String(demain.getMonth() + 1).padStart(2, '0') + '-' + String(demain.getDate()).padStart(2, '0');
  $('#r-date').min = min;
  const v = id => $(id).value.trim();
  function maj() {
    const m = [];
    if (!v('#r-date') || v('#r-date') < min) m.push('une date à venir'); if (!v('#r-heure')) m.push("l'heure");
    if (!v('#r-adresse')) m.push("l'adresse du chantier"); if (!v('#r-societe')) m.push('la société');
    if (!/\d{6,}/.test(v('#r-tel').replace(/\D/g, ''))) m.push('le téléphone'); if (!/^\S+@\S+\.\S+$/.test(v('#r-mail'))) m.push("l'e-mail");
    $('#envoyer').disabled = m.length > 0;
    $('#aide').className = 'form-status' + (m.length ? '' : ' success');
    $('#aide').textContent = m.length ? 'Il manque : ' + m.join(', ') + '.' : 'Tout est prêt.';
  }
  form.addEventListener('input', maj); form.addEventListener('change', maj);
  const ENVOI = 'https://n8n.srv1677224.hstgr.cloud/webhook/mac-presta-demande', debut = Date.now(), bouton = $('#envoyer'), texteBouton = bouton.textContent;
  const texte = id => { const s = $(id); return s.options[s.selectedIndex].text; };
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (bouton.disabled) return;
    const donnees = { date: v('#r-date'), heure: v('#r-heure'), prestation: texte('#r-presta'), creneau: texte('#r-creneau'), adresse: v('#r-adresse'), distance: texte('#r-dist'),
      societe: v('#r-societe'), responsable: v('#r-resp') || 'Non précisé', telephone: v('#r-tel'), email: v('#r-mail'), remarques: v('#r-desc'), site_web: $('#r-site').value, t: Date.now() - debut };
    bouton.disabled = true; bouton.textContent = 'Envoi en cours…'; $('#aide').className = 'form-status loading'; $('#aide').textContent = '';
    const arret = new AbortController(), minuteur = setTimeout(() => arret.abort(), 15000);
    let reussi = false;
    try {
      const r = await fetch(ENVOI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donnees), signal: arret.signal });
      const rep = await r.json().catch(() => ({}));
      reussi = r.ok && rep.ok === true;
    } catch (err) {}
    clearTimeout(minuteur); bouton.textContent = texteBouton;
    if (reussi) { form.style.display = 'none'; $('#envoye').style.display = 'block'; }
    else { bouton.disabled = false; $('#aide').className = 'form-status error'; $('#aide').innerHTML = "L'envoi n'a pas fonctionné. Réessayez dans un instant, ou appelez-moi au <a href=\"tel:+33620535957\" style=\"color:inherit;text-decoration:underline\">06 20 53 59 57</a>."; }
  });
  $('#autre').addEventListener('click', () => { form.reset(); maj(); $('#envoye').style.display = 'none'; form.style.display = 'block'; });
  maj();
});
