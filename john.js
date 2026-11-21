(function(){
  'use strict';
  const DATA = window.LOGOS_JOHN;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if (!DATA) {
    $('#verseList').innerHTML = '<p class="empty-note">数据文件 data/john/john-data.js 未加载。请确认它与本页在同一目录。</p>';
    return;
  }

  const STUDY = window.LOGOS_JOHN_STUDY || [];
  const CHAPTERS = window.LOGOS_JOHN_CHAPTERS || {};
  const INTERTEXTS = window.LOGOS_JOHN_INTERTEXTS || [];
  const MOTIFS = window.LOGOS_JOHN_MOTIFS || [];
  const DEEP = window.LOGOS_JOHN_DEEP || {};
  [window.LOGOS_JOHN_DEEP_1B, window.LOGOS_JOHN_DEEP_2, ...(window.LOGOS_JOHN_DEEP_EXTRAS || [])].filter(Boolean).forEach(extra => {
    if (!DEEP[extra.chapter]) DEEP[extra.chapter] = {verses:{}};
    if (!DEEP[extra.chapter].verses) DEEP[extra.chapter].verses = {};
    Object.keys(extra.verses || {}).forEach(n => { DEEP[extra.chapter].verses[n] = extra.verses[n]; });
  });
  const state = { chapter: 1, selected: null, currentWord: null, panelTab: 'word', scale: 1.16 };
  const FONT_LEVELS = [0.95, 1.06, 1.16, 1.30, 1.45];
  const POS = {N:'名词',V:'动词',A:'形容词',T:'冠词',P:'代词',D:'指示代词',R:'关系代词',K:'疑问/不定代词',X:'不定代词',PREP:'介词',CONJ:'连词',ADV:'副词',PRT:'助词',HEB:'希伯来借词',COND:'条件词',INJ:'感叹词'};
  const CASE = {N:'主格',G:'属格',D:'与格',A:'宾格',V:'呼格'};
  const NUM = {S:'单数',P:'复数'};
  const GEND = {M:'阳性',F:'阴性',N:'中性'};
  const TENSE = {P:'现在时',I:'未完成时',F:'将来时',A:'不定过去时',R:'完成时',L:'过去完成时',X:'未完成时'};
  const VOICE = {A:'主动',M:'中间',P:'被动',D:'中间',O:'主动'};
  const MOOD = {I:'直陈',S:'虚拟',M:'命令',N:'不定式',P:'分词',D:'祈愿'};

  function parseMorph(code) {
    if (!code) return {pos:'未标注', form:'未标注', raw:''};
    if (code === 'PREP') return {pos:'介词', form:'介词', raw:code};
    if (code === 'CONJ') return {pos:'连词', form:'连词', raw:code};
    if (code === 'CONJ-N') return {pos:'连词', form:'连词（否定）', raw:code};
    if (code === 'ADV') return {pos:'副词', form:'副词', raw:code};
    if (code === 'PRT-N') return {pos:'助词', form:'否定助词', raw:code};
    if (code === 'HEB') return {pos:'希伯来借词', form:'希伯来借词', raw:code};
    if (code === 'COND') return {pos:'条件词', form:'条件词', raw:code};
    if (code.startsWith('V-')) {
      const parts = code.slice(2).split('-');
      let tv = parts[0] || '';
      const suffix = parts[1] || '';
      if (tv.startsWith('2')) tv = tv.slice(1);
      const tense = TENSE[tv[0]] || '';
      const voice = VOICE[tv[1]] || '';
      const mood = MOOD[tv[2]] || '';
      const bits = [tense, voice, mood].filter(Boolean);
      if (/^\d[SP]$/.test(suffix)) {
        bits.push('第' + suffix[0] + '人称');
        if (NUM[suffix[1]]) bits.push(NUM[suffix[1]]);
      } else if (/^[NGDAV][SP][MFN]$/.test(suffix)) {
        bits.push(CASE[suffix[0]] || '', NUM[suffix[1]] || '', GEND[suffix[2]] || '');
      }
      return {pos:'动词', form:bits.filter(Boolean).join(' · '), raw:code};
    }
    const bits = code.split('-');
    const first = bits[0];
    const pos = POS[first] || '未标注';
    let form = pos;
    const tail = bits[bits.length - 1];
    const m = tail.match(/^([NGDAV])([SP])([MFN])/);
    if (m) {
      form += ' · ' + (CASE[m[1]] || '') + ' · ' + (NUM[m[2]] || '') + ' · ' + (GEND[m[3]] || '');
    } else if (first === 'N' && code.includes('PRI')) {
      form = '专有名词';
    } else if (first === 'A' && code.includes('NUI')) {
      form = '数词';
    }
    return {pos, form, raw:code};
  }

  function chapterData(n) { return DATA.chapters.find(c => c.n === Number(n)); }

  function wordAt(chapter, verse, index) {
    const ch = chapterData(chapter);
    if (!ch) return null;
    const v = ch.verses.find(x => x.n === verse);
    if (!v || !v.tokens[index]) return null;
    const t = v.tokens[index];
    const lex = DATA.lexicon[t.s] || {};
    const dw = DEEP[chapter] && DEEP[chapter].verses && DEEP[chapter].verses[verse] && DEEP[chapter].verses[verse].words && DEEP[chapter].verses[verse].words[index] || null;
    return {
      chapter, verse, index,
      g:t.g, s:t.s, m:t.m,
      lemma:lex.lemma || t.g,
      tr:lex.tr || '',
      gloss:lex.gloss || '',
      zh:lex.zh || (window.LOGOS_ZH && window.LOGOS_ZH[t.s]) || '',
      cuv:v.cuv || '',
      parse:parseMorph(t.m),
      role:dw ? dw.role : '',
      deepNote:dw ? dw.note : ''
    };
  }

  function greekHTML(v) {
    if (!v.greek) return '';
    let cursor = 0;
    let html = '';
    v.tokens.forEach((t, i) => {
      const idx = v.greek.indexOf(t.g, cursor);
      if (idx < 0) {
        html += `<button type="button" class="tok" data-i="${i}" title="${esc(t.s)} · ${esc(t.m)}">${esc(t.g)}</button>`;
        return;
      }
      html += esc(v.greek.slice(cursor, idx));
      html += `<button type="button" class="tok" data-i="${i}" title="${esc(t.s)} · ${esc(t.m)}" lang="grc">${esc(t.g)}</button>`;
      cursor = idx + t.g.length;
    });
    html += esc(v.greek.slice(cursor));
    return html;
  }

  function autoDeep(ch, v) {
    const guide = CHAPTERS[ch.n] || {};
    const tokens = v.tokens || [];
    const verbs = tokens.filter(t => t.m.startsWith('V-')).map(t => `${t.g}（${parseMorph(t.m).form}）`);
    const particles = tokens.filter(t => /^(CONJ|PREP|PRT|ADV)/.test(t.m)).map(t => t.g);
    const literal = tokens.slice(0, 10).map(t => {
      const lex = DATA.lexicon[t.s] || {};
      return `${t.g}（${lex.zh || lex.gloss || '—'}）`;
    }).join('；');
    const echoes = INTERTEXTS.filter(x => x.chapter === ch.n).map(x => x.ref);
    return {
      read: guide.summary || '本节先按和合本读，再对照希腊词的形态与句法。',
      syntax: tokens.length
        ? `本节共 ${tokens.length} 个词位。主要动词：${verbs.slice(0, 4).join('、') || '无'}。连接词 / 介词：${particles.slice(0, 6).join('、') || '无'}。`
        : 'SBLGNT 未收本节；此处仅列和合本。',
      intertext: echoes.length
        ? `本章互涉：${echoes.join('、')}。`
        : `本章关键词：${guide.key || '—'}；结构：${guide.structure || '—'}。`,
      difference: tokens.length
        ? `原文直词（前 10 词）：${literal}。和合本：${v.cuv || '—'}`
        : `和合本：${v.cuv || '—'}（SBLGNT 未收本节）`,
      auto: true
    };
  }

  function renderChapter() {
    const ch = chapterData(state.chapter);
    if (!ch) return;
    $$('.chapter-chip').forEach(b => b.classList.toggle('active', Number(b.dataset.chapter) === state.chapter));
    const active = $(`.chapter-chip[data-chapter="${state.chapter}"]`);
    if (active && active.scrollIntoView) active.scrollIntoView({block:'nearest', inline:'center'});
    $('#prevChapter').disabled = state.chapter <= 1;
    $('#nextChapter').disabled = state.chapter >= DATA.chapters.length;
    const tokens = ch.verses.reduce((a, v) => a + v.tokens.length, 0);
    $('#chapterMeta').textContent = `第 ${ch.n} 章 · ${ch.verses.length} 节 · ${tokens} 词位`;
    const guide = CHAPTERS[ch.n];
    const deepChapter = DEEP[ch.n] || null;
    const guideHTML = guide ? `
      <article class="chapter-intro">
        <div class="ci-kicker">Chapter Guide · 本章读法</div>
        <h3>${esc(guide.title)}</h3>
        <p>${esc(guide.summary)}</p>
        <div class="ci-meta">
          <span><b>结构</b>${esc(guide.structure)}</span>
          <span><b>关键词</b>${esc(guide.key)}</span>
        </div>
        ${guide.study ? `<button type="button" class="ci-study" data-open-chapter-study="${esc(guide.study)}">重点段落研读 →</button>` : ''}
      </article>` : '';
    $('#verseList').innerHTML = `
      <div class="chapter-heading"><h2>第 ${ch.n} 章</h2><span>JOHN ${ch.n} · ${ch.verses.length} VERSES</span></div>
      ${guideHTML}
      ${ch.verses.map(v => {
        const manual = deepChapter && deepChapter.verses ? deepChapter.verses[v.n] : null;
        const deep = manual || autoDeep(ch, v);
        return `
        <article class="verse" id="v-${ch.n}-${v.n}">
          <div class="verse-num">${v.n}</div>
          <div class="verse-body">
            ${v.greek ? `<div class="verse-greek" lang="grc">${greekHTML(v)}</div>` : ''}
            ${v.cuv ? `<div class="verse-cuv"><b>和合本</b>${esc(v.cuv)}</div>` : ''}
            ${v.note ? `<div class="empty-note">${esc(v.note)}</div>` : ''}
            <div class="verse-deep ${deep.auto ? 'auto-deep' : ''}">
              <div class="deep-head"><span>逐节研读 · 约 ${ch.n}:${v.n}</span>${deep.auto ? '<em class="deep-auto">自动形态初稿 · 待人工精读</em>' : '<em class="deep-manual">人工精读</em>'}</div>
              <p class="deep-lead"><b>读法</b>${esc(deep.read)}</p>
              <p class="deep-field"><b>语法 / 结构</b>${esc(deep.syntax)}</p>
              <p class="deep-field"><b>互涉 / 背景</b>${esc(deep.intertext)}</p>
              <p class="deep-field"><b>和合本差异</b>${esc(deep.difference)}</p>
            </div>
          </div>
        </article>`;
      }).join('')}
    `;
    state.selected = null;
    state.currentWord = null;
    renderPanel();
    try { history.replaceState(null, '', `?chapter=${state.chapter}`); } catch (e) {}
  }

  function emptyPanelHTML() {
    return `<div class="panel-empty">
      <div class="panel-kicker">Word Study · 词形研读</div>
      <h2>点击一个希腊词</h2>
      <p>这里会显示它的词形、词元、Strong 编号与和合本所在句。手机端从底部展开，不打断你正在读的经文。</p>
      <ul>
        <li>希腊文按词位切分，标点保留在词间</li>
        <li>形态码来自 SBLGNT / MorphGNT 标注</li>
        <li>中文简释为人工整理；未收录词显示 STEPBible 英文简释</li>
      </ul>
    </div>`;
  }

  function occurrencesFor(word) {
    const ch = chapterData(word.chapter);
    if (!ch) return [];
    const out = [];
    ch.verses.forEach(v => v.tokens.forEach((t, i) => {
      if (t.s === word.s) out.push({ g:t.g, verse:v.n, i });
    }));
    return out;
  }

  function wordHTML(word) {
    if (!word) return emptyPanelHTML();
    const zh = word.zh || '';
    const occurrences = occurrencesFor(word).slice(0, 10);
    return `
      <div class="w-head">
        <div class="w-greek" lang="grc">${esc(word.g)}</div>
        <div class="w-meta">${esc(word.s)}<br>${esc(word.m)}</div>
      </div>
      <div class="w-tags"><span>${esc(word.parse.pos)}</span><span>${esc(word.s)}</span><span>${esc(word.m)}</span></div>
      <div class="w-zh ${zh ? '' : 'pending'}">${zh ? esc(zh) : '中文简释待补'}</div>
      <div class="w-en">${zh ? 'STEPBible 英文简释：' : ''}${esc(word.gloss || '—')}</div>
      <div class="w-parse">${esc(word.parse.form)}</div>
      <div class="morph-grid">
        <div><small>词性</small><b>${esc(word.parse.pos)}</b></div>
        <div><small>形态</small><b>${esc(word.parse.form)}</b></div>
        <div><small>词形码</small><b>${esc(word.m)}</b></div>
        <div><small>位置</small><b>约 ${word.chapter}:${word.verse} · 第 ${word.index + 1} 词</b></div>
      </div>
      <div class="w-row"><span>词元</span><b lang="grc">${esc(word.lemma)}</b></div>
      <div class="w-row"><span>转写</span><b>${esc(word.tr || '—')}</b></div>
      ${word.role ? `<div class="w-role"><small>句法角色</small><b>${esc(word.role)}</b></div>` : ''}
      ${word.deepNote ? `<p class="w-deep-note">${esc(word.deepNote)}</p>` : ''}
      <div class="w-cuv"><b>和合本 · 约 ${word.chapter}:${word.verse}</b>${esc(word.cuv || '（SBLGNT 未收此节）')}</div>
      <div class="occ-block">
        <small>本章同词元 · ${occurrences.length} 处</small>
        <div class="occ-list">${occurrences.length ? occurrences.map(o => `<button type="button" class="occ-chip" data-occ-verse="${o.verse}" data-occ-index="${o.i}"><span lang="grc">${esc(o.g)}</span><em>${o.verse}</em></button>`).join('') : '<span class="occ-empty">本章没有重复词形</span>'}</div>
      </div>
      <p class="w-tip">中文简释按约翰福音常用义整理；同一个希腊词在不同上下文可有不同译法，请以和合本整句和上下文为准。</p>
    `;
  }

  function intertextHTML() {
    const local = INTERTEXTS.filter(item => item.chapter === state.chapter);
    const cards = local.length ? local : INTERTEXTS.filter(item => item.chapter === 1);
    return `
      <div class="panel-kicker">Intertextuality · 互涉背景</div>
      <h3 class="panel-title">${local.length ? `第 ${state.chapter} 章的经文回声` : '全书示范互涉'}</h3>
      <p class="panel-intro">${local.length ? '同一句话可能在另一卷书的回声里被重新点亮。这里列本章相关的共享词、意象与神学语法。' : '本章暂无专门的互涉卡片；以下是 1:1–5 的示范条目，帮助你看互涉如何工作。'}</p>
      <div class="it-method"><b>分级说明</b>标签按“直接引用 / LXX 词语复用 / 预表类型 / 主题回响 / 新约内部呼应”区分。原文词条来自本项目数据；只有可核对的 LXX 短语才标“LXX 词语复用”，不把主题回响冒充成逐字引用，也不逐条假托注释书。</div>
      <div class="it-list">
        ${cards.map(item => `
          <article class="it-item">
            <div class="it-top"><span class="it-ref">${esc(item.ref)}</span><span class="it-type">${esc(item.type)}</span></div>
            <div class="it-tags"><span class="it-parallel">${esc(item.parallelType || '未分级')}</span><span class="it-lang">${esc(item.language || (item.originalType === 'he' ? '希伯来文' : '希腊文'))}</span>${item.scope ? `<span class="it-scope">${esc(item.scope)}</span>` : ''}</div>
            ${item.original ? `<div class="it-original ${item.originalType === 'he' ? 'he' : ''}" ${item.originalType === 'he' ? 'dir="rtl"' : ''}>${esc(item.original)}</div>` : ''}
            <div class="it-cn">${esc(item.cn)}</div>
            <p class="it-note">${esc(item.note)}</p>
            ${item.evidence ? `<div class="it-evidence"><b>判断依据</b>${esc(item.evidence)}</div>` : ''}
          </article>`).join('')}
      </div>`;
  }

  function radarSVG() {
    const cx = 150, cy = 150, r = 88;
    const max = Math.max(...MOTIFS.map(item => item.count), 1);
    const points = MOTIFS.map((item, i) => {
      const angle = -Math.PI / 2 + i * (Math.PI * 2 / MOTIFS.length);
      const value = 0.18 + (item.count / max) * 0.82;
      return {
        x: cx + Math.cos(angle) * r * value,
        y: cy + Math.sin(angle) * r * value,
        ax: cx + Math.cos(angle) * r,
        ay: cy + Math.sin(angle) * r,
        lx: cx + Math.cos(angle) * (r + 18),
        ly: cy + Math.sin(angle) * (r + 18),
        anchor: Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle',
        name: item.name
      };
    });
    const rings = [0.25, 0.5, 0.75, 1].map(v => {
      const pts = MOTIFS.map((_, i) => {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / MOTIFS.length);
        return `${(cx + Math.cos(a) * r * v).toFixed(1)},${(cy + Math.sin(a) * r * v).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="rgba(72,53,36,.12)" stroke-width=".8"/>`;
    }).join('');
    return `<div class="radar-wrap"><svg class="radar-svg" viewBox="0 0 300 300" role="img" aria-label="约翰福音八个母题的词频雷达">
      ${rings}
      ${points.map(p => `<line x1="${cx}" y1="${cy}" x2="${p.ax.toFixed(1)}" y2="${p.ay.toFixed(1)}" stroke="rgba(72,53,36,.12)" stroke-width=".7"/>`).join('')}
      <polygon points="${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="rgba(138,59,46,.16)" stroke="rgba(138,59,46,.75)" stroke-width="1.2"/>
      ${points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.4" fill="var(--accent)"/>`).join('')}
      ${points.map(p => `<text x="${p.lx.toFixed(1)}" y="${p.ly.toFixed(1)}" text-anchor="${p.anchor}" font-size="7.5" fill="var(--muted)" font-family="var(--serif)">${esc(p.name)}</text>`).join('')}
    </svg></div>`;
  }

  function motifHTML() {
    const max = Math.max(...MOTIFS.map(item => item.count), 1);
    return `
      <div class="panel-kicker">Motif Radar · 母题雷达</div>
      <h3 class="panel-title">全书母题与章节分布</h3>
      <p class="panel-intro">按词元/词族统计约翰福音的八个核心词族；雷达看全书比重，柱形看 1–21 章分布，当前章以暖色标出。</p>
      ${radarSVG()}
      <div class="motif-list">
        ${MOTIFS.map(item => `
          <article class="motif-item">
            <div class="mi-top"><span class="mi-name">${esc(item.name)} <em>${esc(item.greek)}</em></span><b>${item.count}</b></div>
            <div class="mi-bars">${item.chapters.map((n, i) => `<i class="${i === state.chapter - 1 ? 'now' : ''}" style="height:${n ? Math.max(4, Math.round(n / max * 34)) : 2}px" title="第 ${i + 1} 章：${n} 次"></i>`).join('')}</div>
            <p>${esc(item.note)}</p>
          </article>`).join('')}
      </div>`;
  }

  function renderPanel() {
    const html = state.panelTab === 'intertext' ? intertextHTML() : state.panelTab === 'motif' ? motifHTML() : wordHTML(state.currentWord);
    const body = $('#wordPanelBody');
    if (body) body.innerHTML = html;
    const sheet = $('#sheetBody');
    if (sheet) sheet.innerHTML = html;
    $$('.panel-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.panelTab === state.panelTab));
  }

  function openSheet() {
    renderPanel();
    document.body.classList.add('sheet-open');
    $('#sheetBackdrop').classList.add('show');
    $('#wordSheet').classList.add('open');
  }

  function closeSheet() {
    document.body.classList.remove('sheet-open');
    $('#sheetBackdrop').classList.remove('show');
    $('#wordSheet').classList.remove('open');
  }

  function renderStudyCards() {
    if (!STUDY.length) return;
    $('#studyGrid').innerHTML = STUDY.map(card => `
      <article class="study-card" data-study-id="${esc(card.id)}">
        <div class="study-card-top">
          <span class="study-ref">约 ${card.ref}</span>
          <span class="study-tags">${card.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</span>
        </div>
        <h3>${esc(card.title)}</h3>
        <p class="study-summary">${esc(card.summary)}</p>
        <p class="study-reading"><b>结构 / 修辞：</b>${esc(card.reading)}</p>
        <p class="study-diff"><b>和合本差异：</b>${esc(card.difference)}</p>
        <div class="study-actions">
          <button type="button" class="study-jump" data-study-chapter="${card.chapter}" data-study-verse="${card.verse}">跳到经文 →</button>
          ${card.deep ? '<a class="study-deep" href="index.html">打开 1:1–5 深度研读 →</a>' : ''}
        </div>
      </article>
    `).join('');
  }

  function openStudy(studyId) {
    renderStudyCards();
    document.body.classList.add('study-open');
    $('#studyBackdrop').classList.add('show');
    if (studyId) {
      setTimeout(() => {
        const card = $(`[data-study-id="${studyId}"]`);
        if (card) {
          card.scrollIntoView({block:'center', behavior:'smooth'});
          card.classList.add('study-focus');
          setTimeout(() => card.classList.remove('study-focus'), 1800);
        }
      }, 120);
    }
  }

  function closeStudy() {
    document.body.classList.remove('study-open');
    $('#studyBackdrop').classList.remove('show');
  }

  function openLiterary() {
    document.body.classList.add('study-open');
    $('#literaryBackdrop').classList.add('show');
  }

  function closeLiterary() {
    document.body.classList.remove('study-open');
    $('#literaryBackdrop').classList.remove('show');
  }

  function jumpToStudy(chapter, verse) {
    closeStudy();
    closeSheet();
    state.chapter = chapter;
    renderChapter();
    setTimeout(() => {
      const el = document.getElementById(`v-${chapter}-${verse}`);
      if (el) {
        el.scrollIntoView({block:'center', behavior:'smooth'});
        el.classList.add('verse-focus');
        setTimeout(() => el.classList.remove('verse-focus'), 1700);
      }
    }, 80);
  }

  function selectWord(chapter, verse, index, button) {
    const word = wordAt(chapter, verse, index);
    if (!word) return;
    state.selected = {chapter, verse, index};
    state.currentWord = word;
    state.panelTab = 'word';
    $$('.tok').forEach(b => b.classList.remove('active'));
    if (button) button.classList.add('active');
    renderPanel();
    if (matchMedia('(max-width:1080px)').matches) openSheet();
  }

  $('#verseList').addEventListener('click', event => {
    const studyBtn = event.target.closest('[data-open-chapter-study]');
    if (studyBtn) {
      openStudy(studyBtn.dataset.openChapterStudy);
      return;
    }
    const btn = event.target.closest('.tok');
    if (!btn) return;
    const verse = Number(btn.closest('.verse').id.split('-').pop());
    selectWord(state.chapter, verse, Number(btn.dataset.i), btn);
  });

  document.addEventListener('click', event => {
    const occurrence = event.target.closest('[data-occ-verse]');
    if (occurrence) {
      selectWord(state.chapter, Number(occurrence.dataset.occVerse), Number(occurrence.dataset.occIndex));
      return;
    }
    const tab = event.target.closest('[data-panel-tab]');
    if (!tab) return;
    state.panelTab = tab.dataset.panelTab;
    renderPanel();
  });

  $('#chapterChips').addEventListener('click', event => {
    const btn = event.target.closest('.chapter-chip');
    if (!btn) return;
    state.chapter = Number(btn.dataset.chapter);
    closeSheet();
    renderChapter();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  $('#prevChapter').addEventListener('click', () => {
    if (state.chapter > 1) { state.chapter--; closeSheet(); renderChapter(); window.scrollTo({top:0, behavior:'smooth'}); }
  });
  $('#nextChapter').addEventListener('click', () => {
    if (state.chapter < DATA.chapters.length) { state.chapter++; closeSheet(); renderChapter(); window.scrollTo({top:0, behavior:'smooth'}); }
  });
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#sheetBackdrop').addEventListener('click', closeSheet);
  $('#openStudy').addEventListener('click', openStudy);
  $('#studyClose').addEventListener('click', closeStudy);
  $('#studyBackdrop').addEventListener('click', event => {
    if (event.target === $('#studyBackdrop')) closeStudy();
  });
  $('#literaryClose').addEventListener('click', closeLiterary);
  $('#literaryBackdrop').addEventListener('click', event => {
    if (event.target === $('#literaryBackdrop')) closeLiterary();
  });
  $('#studyGrid').addEventListener('click', event => {
    const jump = event.target.closest('[data-study-chapter]');
    if (!jump) return;
    jumpToStudy(Number(jump.dataset.studyChapter), Number(jump.dataset.studyVerse));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#literaryBackdrop').classList.contains('show')) { closeLiterary(); return; }
      if ($('#studyBackdrop').classList.contains('show')) { closeStudy(); return; }
      closeSheet();
    }
  });
  window.addEventListener('resize', () => { if (!matchMedia('(max-width:1080px)').matches) closeSheet(); });

  function applyScale(level) {
    state.scale = Math.max(0, Math.min(FONT_LEVELS.length - 1, level));
    document.documentElement.style.setProperty('--read-scale', FONT_LEVELS[state.scale]);
    $$('[data-font-reset]').forEach(b => b.textContent = Math.round(FONT_LEVELS[state.scale] * 100) + '%');
    try { localStorage.setItem('logos.johnFontLevel', String(state.scale)); } catch (e) {}
  }
  $$('[data-font-step]').forEach(b => b.addEventListener('click', () => applyScale(state.scale + Number(b.dataset.fontStep))));
  $$('[data-font-reset]').forEach(b => b.addEventListener('click', () => applyScale(2)));

  const initial = Math.max(1, Math.min(DATA.chapters.length, Number(new URLSearchParams(location.search).get('chapter')) || 1));
  state.chapter = initial;
  $('#chapterChips').innerHTML = DATA.chapters.map(c => `<button type="button" class="chapter-chip" data-chapter="${c.n}">${c.n}</button>`).join('');
  try {
    const stored = localStorage.getItem('logos.johnFontLevel');
    if (stored !== null) {
      const saved = Number(stored);
      if (Number.isFinite(saved) && saved >= 0 && saved < FONT_LEVELS.length) applyScale(saved);
    }
  } catch (e) {}
  renderChapter();
})();
