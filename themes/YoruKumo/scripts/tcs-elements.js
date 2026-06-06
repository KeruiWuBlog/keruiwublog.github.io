'use strict';

const katex = require('katex');

const ELEMENTS = {
  theorem: { label: 'Theorem', numbered: true },
  lemma: { label: 'Lemma', numbered: true },
  proposition: { label: 'Proposition', numbered: true },
  corollary: { label: 'Corollary', numbered: true },
  definition: { label: 'Definition', numbered: true },
  assumption: { label: 'Assumption', numbered: true },
  remark: { label: 'Remark', numbered: true },
  example: { label: 'Example', numbered: true },
  proof: { label: 'Proof', numbered: false },
};

const ELEMENT_NAMES = Object.keys(ELEMENTS).join('|');
const FENCE_RE = /(^|\n)([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n\2\3[ \t]*(?=\n|$)/g;
const CONTAINER_RE = new RegExp(
  String.raw`^:::[ \t]*(${ELEMENT_NAMES})(?:[ \t]+([^\n]+?))?[ \t]*\n([\s\S]*?)^:::[ \t]*$`,
  'gim'
);
const TEX_ENV_RE = new RegExp(
  String.raw`\\begin\{(${ELEMENT_NAMES})\}(?:\[([^\]]+)\])?\s*\n?([\s\S]*?)\\end\{\1\}`,
  'gim'
);
const PAPER_RE = /^:::[ \t]*paper[ \t]+([A-Za-z0-9:_-]+)[ \t]*\n([\s\S]*?)^:::[ \t]*$/gim;
const ALGORITHM_CONTAINER_RE = /^:::[ \t]*algorithm(?:[ \t]+([^\n]+?))?[ \t]*\n([\s\S]*?)^:::[ \t]*$/gim;
const ALGORITHM_TEX_RE = /\\begin\{algorithm\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{algorithm\}/gim;
const ALGORITHMIC_RE = /\\begin\{algorithmic\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{algorithmic\}/im;

function protectCodeFences(source, algorithmState) {
  const fences = [];
  const content = source.replace(FENCE_RE, (match, prefix, indent, marker, info, body) => {
    const language = info.trim().split(/\s+/, 1)[0].toLowerCase();

    if (algorithmState && ['pseudo', 'pseudocode', 'algorithm'].includes(language)) {
      return `${prefix}${renderAlgorithm(body, parseAlgorithmFenceMeta(info), algorithmState)}`;
    }

    const token = `\u0000TCS_FENCE_${fences.length}\u0000`;
    fences.push(match);
    return token;
  });

  return { content, fences };
}

function protectExistingTcsHtml(source) {
  const html = [];
  const htmlRe = /<section\s+class="tcs-(?:box|references)[\s\S]*?<\/section>|<figure\s+class="tcs-algorithm[\s\S]*?<\/figure>|<aside\s+class="tcs-paper-card[\s\S]*?<\/aside>|<(span|div|a)\s+class="tcs-(?:math|citation)[^"]*"[\s\S]*?<\/\1>/g;
  const content = source.replace(htmlRe, match => {
    const token = `\u0000TCS_HTML_${html.length}\u0000`;
    html.push(match);
    return token;
  });

  return { content, html };
}

function restoreCodeFences(source, fences) {
  return source.replace(/\u0000TCS_FENCE_(\d+)\u0000/g, (_, index) => fences[Number(index)]);
}

function restoreExistingTcsHtml(source, html) {
  return source.replace(/\u0000TCS_HTML_(\d+)\u0000/g, (_, index) => html[Number(index)]);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function protectMathAnnotations(html) {
  return html.replace(/(<annotation\b[^>]*>)([\s\S]*?)(<\/annotation>)/g, (_, open, body, close) => {
    return `${open}${body.replace(/_/g, '&#95;').replace(/\*/g, '&#42;')}${close}`;
  });
}

function protectMath(source) {
  const math = [];

  function stash(html) {
    const token = `\u0000TCS_MATH_${math.length}\u0000`;
    math.push(html);
    return token;
  }

  function renderLatex(body, displayMode) {
    return protectMathAnnotations(katex.renderToString(body.trim(), {
      displayMode,
      throwOnError: false,
      strict: 'warn',
      trust: false,
    }));
  }

  function display(body) {
    return stash(`\n<div class="tcs-math tcs-math-display">${renderLatex(body, true)}</div>\n`);
  }

  function inline(body) {
    return stash(`<span class="tcs-math tcs-math-inline">${renderLatex(body, false)}</span>`);
  }

  const protectedSource = source
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, body) => display(body))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => display(body))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => inline(body))
    .replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix, body) => {
      return `${prefix}${inline(body)}`;
    });

  return protectedSource.replace(/\u0000TCS_MATH_(\d+)\u0000/g, (_, index) => math[Number(index)]);
}

function normalizeTitle(value) {
  if (!value) return '';

  let title = value.trim();
  const wrappers = [
    ['[', ']'],
    ['(', ')'],
    ['{', '}'],
    ['"', '"'],
    ["'", "'"],
  ];

  for (const [open, close] of wrappers) {
    if (title.startsWith(open) && title.endsWith(close)) {
      title = title.slice(1, -1).trim();
      break;
    }
  }

  return title;
}

function makeSafeId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'paper';
}

function parseAlgorithmFenceMeta(info) {
  const meta = {};
  const rest = info.trim().replace(/^(?:pseudo|pseudocode|algorithm)\b/i, '').trim();
  const titleMatch = rest.match(/\[([^\]]+)\]|(?:caption|title)=["']([^"']+)["']|(?:caption|title)=([^\s]+)/i);
  const labelMatch = rest.match(/label=["']?([A-Za-z0-9:_-]+)["']?/i);

  if (titleMatch) {
    meta.title = titleMatch[1] || titleMatch[2] || titleMatch[3] || '';
  } else if (rest && !/^[A-Za-z]+=/i.test(rest)) {
    meta.title = rest;
  }

  if (labelMatch) meta.label = labelMatch[1];
  return meta;
}

function renderInlineLatex(body) {
  return protectMathAnnotations(katex.renderToString(body.trim(), {
    displayMode: false,
    throwOnError: false,
    strict: 'warn',
    trust: false,
  }));
}

function renderPseudoText(value) {
  const stash = [];

  function token(html) {
    const key = `\u0000TCS_ALG_INLINE_${stash.length}\u0000`;
    stash.push(html);
    return key;
  }

  const protectedValue = String(value)
    .replace(/\\Comment\{([^}]*)\}/g, (_, comment) => {
      return token(`<span class="tcs-algorithm-comment">// ${escapeHtml(comment.trim())}</span>`);
    })
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => {
      return token(`<span class="tcs-math tcs-math-inline">${renderInlineLatex(body)}</span>`);
    })
    .replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix, body) => {
      return `${prefix}${token(`<span class="tcs-math tcs-math-inline">${renderInlineLatex(body)}</span>`)}`;
    });

  return escapeHtml(protectedValue).replace(/\u0000TCS_ALG_INLINE_(\d+)\u0000/g, (_, index) => stash[Number(index)]);
}

function algorithmKeyword(value) {
  return `<span class="tcs-algorithm-keyword">${escapeHtml(value)}</span>`;
}

function makeAlgorithmLine(kind, text, indent) {
  return [
    `<li class="tcs-algorithm-line tcs-algorithm-${kind}" style="--indent:${Math.max(indent, 0)}">`,
    '<span class="tcs-algorithm-number"></span>',
    `<span class="tcs-algorithm-code">${text}</span>`,
    '</li>',
  ].join('');
}

function normalizeAlgorithmBody(rawBody) {
  return rawBody
    .replace(/\\label\{[^}]+\}/g, '')
    .replace(/\\caption\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
    .trim();
}

function renderAlgorithmLines(rawBody) {
  const lines = normalizeAlgorithmBody(rawBody).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let indent = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%')) continue;

    const command = line.match(/^\\([A-Za-z]+)\*?(?:\{([\s\S]*)\})?(?:[ \t]+([\s\S]*))?$/);

    if (!command) {
      html.push(makeAlgorithmLine('state', renderPseudoText(line), indent));
      continue;
    }

    const name = command[1];
    const content = (command[2] || command[3] || '').trim();

    if (/^End(For|If|While|Procedure|Function)$/i.test(name)) {
      indent = Math.max(indent - 1, 0);
      const block = name.replace(/^End/i, '').toLowerCase();
      html.push(makeAlgorithmLine('end', `${algorithmKeyword('end')} ${algorithmKeyword(block)}`, indent));
      continue;
    }

    if (/^(Else|ElsIf)$/i.test(name)) {
      indent = Math.max(indent - 1, 0);
      if (/^ElsIf$/i.test(name)) {
        html.push(makeAlgorithmLine('branch', `${algorithmKeyword('else if')} ${renderPseudoText(content)} ${algorithmKeyword('then')}`, indent));
      } else {
        html.push(makeAlgorithmLine('branch', algorithmKeyword('else'), indent));
      }
      indent += 1;
      continue;
    }

    if (/^ForAll$/i.test(name)) {
      html.push(makeAlgorithmLine('block', `${algorithmKeyword('for all')} ${renderPseudoText(content)} ${algorithmKeyword('do')}`, indent));
      indent += 1;
      continue;
    }

    if (/^For$/i.test(name)) {
      html.push(makeAlgorithmLine('block', `${algorithmKeyword('for')} ${renderPseudoText(content)} ${algorithmKeyword('do')}`, indent));
      indent += 1;
      continue;
    }

    if (/^If$/i.test(name)) {
      html.push(makeAlgorithmLine('block', `${algorithmKeyword('if')} ${renderPseudoText(content)} ${algorithmKeyword('then')}`, indent));
      indent += 1;
      continue;
    }

    if (/^While$/i.test(name)) {
      html.push(makeAlgorithmLine('block', `${algorithmKeyword('while')} ${renderPseudoText(content)} ${algorithmKeyword('do')}`, indent));
      indent += 1;
      continue;
    }

    if (/^Repeat$/i.test(name)) {
      html.push(makeAlgorithmLine('block', algorithmKeyword('repeat'), indent));
      indent += 1;
      continue;
    }

    if (/^Until$/i.test(name)) {
      indent = Math.max(indent - 1, 0);
      html.push(makeAlgorithmLine('block', `${algorithmKeyword('until')} ${renderPseudoText(content)}`, indent));
      continue;
    }

    if (/^Return$/i.test(name)) {
      html.push(makeAlgorithmLine('state', `${algorithmKeyword('return')} ${renderPseudoText(content)}`, indent));
      continue;
    }

    if (/^(Require|Ensure|Input|Output)$/i.test(name)) {
      const label = /^(Ensure|Output)$/i.test(name) ? 'Output' : 'Input';
      html.push(makeAlgorithmLine('meta', `<strong>${label}:</strong> ${renderPseudoText(content)}`, indent));
      continue;
    }

    if (/^Statex$/i.test(name)) {
      html.push(makeAlgorithmLine('note', renderPseudoText(content), indent));
      continue;
    }

    html.push(makeAlgorithmLine('state', renderPseudoText(content || line.replace(/^\\[A-Za-z]+\*?/, '').trim()), indent));
  }

  return html.join('\n');
}

function readBracedCommand(source, commandName) {
  const start = source.search(new RegExp(String.raw`\\${commandName}\{`));
  if (start === -1) return '';

  let index = start + commandName.length + 2;
  let depth = 1;
  let value = '';

  while (index < source.length && depth > 0) {
    const char = source[index];

    if (char === '\\') {
      value += char;
      index += 1;
      if (index < source.length) value += source[index];
    } else if (char === '{') {
      depth += 1;
      value += char;
    } else if (char === '}') {
      depth -= 1;
      if (depth > 0) value += char;
    } else {
      value += char;
    }

    index += 1;
  }

  return value.trim();
}

function renderAlgorithm(rawBody, meta, state) {
  const caption = normalizeTitle(meta.title || readBracedCommand(rawBody, 'caption'));
  const labelKey = (meta.label || readBracedCommand(rawBody, 'label')).trim();
  const algorithmic = rawBody.match(ALGORITHMIC_RE);
  const body = algorithmic ? algorithmic[1] : rawBody;
  const number = ++state.counter;
  const id = labelKey ? makeSafeId(labelKey) : `tcs-algorithm-${number}`;
  const titleHtml = caption ? `<span class="tcs-algorithm-title">${escapeHtml(caption)}</span>` : '';

  if (labelKey) {
    state.refs[labelKey] = { type: 'Algorithm', number, id };
  }

  return [
    `<figure class="tcs-algorithm" id="${id}">`,
    '<figcaption class="tcs-algorithm-caption">',
    `<span class="tcs-algorithm-label">Algorithm ${number}</span>`,
    titleHtml,
    '</figcaption>',
    `<ol class="tcs-algorithm-lines">${renderAlgorithmLines(body)}</ol>`,
    '</figure>',
  ].join('\n');
}

function processAlgorithms(source, state) {
  let output = source.replace(ALGORITHM_CONTAINER_RE, (match, title, body) => {
    return renderAlgorithm(body, { title }, state);
  });

  output = output.replace(ALGORITHM_TEX_RE, (match, body) => {
    return renderAlgorithm(body, {}, state);
  });

  return output;
}

function parsePaperFields(raw) {
  const paper = {};
  let currentKey = '';

  raw.replace(/\r\n?/g, '\n').split('\n').forEach(line => {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);

    if (field) {
      currentKey = field[1].toLowerCase();
      paper[currentKey] = field[2].trim();
      return;
    }

    if (currentKey && line.trim()) {
      paper[currentKey] += ` ${line.trim()}`;
    }
  });

  return paper;
}

function splitAuthors(authors) {
  if (!authors) return [];

  if (authors.includes(';')) {
    return authors.split(';').map(author => author.trim()).filter(Boolean);
  }

  if (/\s+and\s+/i.test(authors)) {
    return authors.split(/\s+and\s+/i).map(author => author.trim()).filter(Boolean);
  }

  return [authors.trim()];
}

function getLastName(author) {
  if (!author) return '';

  if (author.includes(',')) {
    return author.split(',')[0].trim();
  }

  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1] || author;
}

function makeYearSuffix(year) {
  const match = String(year || '').match(/\d{4}/);
  return match ? match[0].slice(-2) : 'nd';
}

function makeAlphaAuthorPart(authors, fallback) {
  if (!authors.length) {
    return makeSafeId(fallback).slice(0, 3).padEnd(3, 'x');
  }

  if (authors.length === 1) {
    return getLastName(authors[0])
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 3)
      .padEnd(3, 'x');
  }

  return authors
    .slice(0, 4)
    .map(author => getLastName(author).replace(/[^A-Za-z0-9]/g, '').charAt(0))
    .join('');
}

function makeAlphaLabel(paper, key) {
  if (paper.label) return paper.label;

  const authors = splitAuthors(paper.authors || paper.author || '');
  const authorPart = makeAlphaAuthorPart(authors, key);
  const suffix = makeYearSuffix(paper.year || paper.date);
  return `${authorPart.charAt(0).toUpperCase()}${authorPart.slice(1)}${suffix}`;
}

function getCitationParts(paper, key) {
  const authors = splitAuthors(paper.authors || paper.author || '');
  const year = paper.year || paper.date || 'n.d.';
  let authorText = paper.short || '';

  if (!authorText) {
    if (authors.length === 0) authorText = key;
    else if (authors.length === 1) authorText = getLastName(authors[0]);
    else if (authors.length === 2) authorText = `${getLastName(authors[0])} and ${getLastName(authors[1])}`;
    else authorText = `${getLastName(authors[0])} et al.`;
  }

  return {
    authorText,
    year,
    label: makeAlphaLabel(paper, key),
  };
}

function splitCitationKeys(rawKeys) {
  return rawKeys.split(',').map(key => key.trim()).filter(Boolean);
}

function makeDoiUrl(doi) {
  if (!doi) return '';
  return doi.startsWith('http://') || doi.startsWith('https://') ? doi : `https://doi.org/${doi}`;
}

function makeArxivUrl(arxiv) {
  if (!arxiv) return '';
  return arxiv.startsWith('http://') || arxiv.startsWith('https://') ? arxiv : `https://arxiv.org/abs/${arxiv}`;
}

function renderCitationForKey(key, mode, papers, citedKeys) {
  if (!citedKeys.includes(key)) citedKeys.push(key);

  const paper = papers[key];
  if (!paper) {
    return `<span class="tcs-citation tcs-citation-missing">[${escapeHtml(key)}?]</span>`;
  }

  const { authorText, label } = getCitationParts(paper, key);
  const href = `#ref-${makeSafeId(key)}`;

  if (mode === 't') {
    return `<a class="tcs-citation tcs-citation-textual" href="${href}">${escapeHtml(authorText)}</a> <span class="tcs-citation-year">[${escapeHtml(label)}]</span>`;
  }

  return `<a class="tcs-citation" href="${href}">${escapeHtml(label)}</a>`;
}

function renderCitation(keys, mode, papers, citedKeys) {
  const items = keys.map(key => renderCitationForKey(key, mode, papers, citedKeys));
  if (mode === 't') return items.join('; ');

  const open = mode === 'p' ? '(' : '[';
  const close = mode === 'p' ? ')' : ']';
  return `<span class="tcs-citation-group">${open}${items.join('; ')}${close}</span>`;
}

function renderPaperLinks(paper) {
  const links = [];
  const url = paper.url || paper.link;
  const doiUrl = makeDoiUrl(paper.doi || '');
  const arxivUrl = makeArxivUrl(paper.arxiv || '');

  if (url) links.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Paper</a>`);
  if (doiUrl) links.push(`<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener">DOI</a>`);
  if (arxivUrl) links.push(`<a href="${escapeHtml(arxivUrl)}" target="_blank" rel="noopener">arXiv</a>`);

  if (!links.length) return '';
  return `<div class="tcs-paper-links">${links.join('')}</div>`;
}

function renderPaperCard(key, papers) {
  const paper = papers[key];
  if (!paper) {
    return `<aside class="tcs-paper-card tcs-paper-missing">Unknown paper: <code>${escapeHtml(key)}</code></aside>`;
  }

  const title = paper.title || key;
  const venue = [paper.venue || paper.booktitle || paper.journal, paper.year].filter(Boolean).join(', ');
  const authors = paper.authors || paper.author || '';

  return [
    `<aside class="tcs-paper-card" id="paper-${makeSafeId(key)}">`,
    '<div class="tcs-paper-card-label">Paper</div>',
    `<div class="tcs-paper-card-title">${escapeHtml(title)}</div>`,
    authors ? `<div class="tcs-paper-card-authors">${escapeHtml(authors)}</div>` : '',
    venue ? `<div class="tcs-paper-card-venue">${escapeHtml(venue)}</div>` : '',
    paper.note ? `<div class="tcs-paper-card-note">${escapeHtml(paper.note)}</div>` : '',
    renderPaperLinks(paper),
    '</aside>',
  ].filter(Boolean).join('\n');
}

function renderBibliography(papers, citedKeys) {
  const keys = citedKeys.length ? citedKeys : Object.keys(papers);

  if (!keys.length) {
    return '<section class="tcs-references"><h2>References</h2><p>No papers defined.</p></section>';
  }

  const items = keys.map(key => {
    const paper = papers[key];
    if (!paper) {
      return `<li id="ref-${makeSafeId(key)}" class="tcs-reference-item tcs-reference-missing">Missing reference: <code>${escapeHtml(key)}</code></li>`;
    }

    const title = paper.title || key;
    const authors = paper.authors || paper.author || '';
    const venue = paper.venue || paper.booktitle || paper.journal || '';
    const year = paper.year || paper.date || '';
    const label = makeAlphaLabel(paper, key);

    return [
      `<li id="ref-${makeSafeId(key)}" class="tcs-reference-item">`,
      `<span class="tcs-ref-label">[${escapeHtml(label)}]</span>`,
      '<span class="tcs-ref-body">',
      authors ? `<span class="tcs-ref-authors">${escapeHtml(authors)}.</span>` : '',
      year ? `<span class="tcs-ref-year"> ${escapeHtml(year)}.</span>` : '',
      `<span class="tcs-ref-title"> ${escapeHtml(title)}.</span>`,
      venue ? `<span class="tcs-ref-venue"> ${escapeHtml(venue)}.</span>` : '',
      paper.note ? `<span class="tcs-ref-note"> ${escapeHtml(paper.note)}.</span>` : '',
      renderPaperLinks(paper),
      '</span>',
      '</li>',
    ].filter(Boolean).join('');
  }).join('\n');

  return [
    '<section class="tcs-references">',
    '<h2>References</h2>',
    `<ul class="tcs-reference-list">${items}</ul>`,
    '</section>',
  ].join('\n');
}

function processPaperReferences(source, papers, citedKeys) {
  let output = source.replace(PAPER_RE, (match, key, body) => {
    papers[key.trim()] = parsePaperFields(body);
    return '';
  });

  output = output
    .replace(/\\cite([pt]?)\{([^}]+)\}/g, (match, mode, rawKeys) => {
      return renderCitation(splitCitationKeys(rawKeys), mode, papers, citedKeys);
    })
    .replace(/\[@([A-Za-z0-9:_-]+)\]/g, (match, key) => {
      return renderCitation([key], '', papers, citedKeys);
    })
    .replace(/\\paper\{([^}]+)\}/g, (match, rawKey) => {
      return renderPaperCard(rawKey.trim(), papers);
    });

  output = output.replace(/\\(?:printbibliography|references)\b/g, () => {
    return renderBibliography(papers, citedKeys);
  });

  return output;
}

async function replaceAsync(source, regex, replacer) {
  const matches = [];
  source.replace(regex, (...args) => {
    matches.push(args);
    return args[0];
  });

  const replacements = await Promise.all(matches.map(args => replacer(...args)));
  let index = 0;
  return source.replace(regex, () => replacements[index++]);
}

function makeHeader(kind, title, number) {
  const meta = ELEMENTS[kind];
  const displayNumber = meta.numbered ? ` ${number}` : '';
  const titleHtml = title ? `<span class="tcs-box-title">${escapeHtml(title)}</span>` : '';

  return [
    '<div class="tcs-box-header">',
    `<span class="tcs-box-label">${meta.label}${displayNumber}</span>`,
    titleHtml,
    '</div>',
  ].join('');
}

function wrapBox(kind, title, bodyHtml, counters, labelKey, refs, index) {
  const meta = ELEMENTS[kind];
  const number = meta.numbered ? ++counters[kind] : null;
  const proofQed = kind === 'proof' ? '<span class="tcs-qed" aria-hidden="true">□</span>' : '';
  const id = labelKey
    ? makeSafeId(labelKey)
    : (number != null ? `tcs-${kind}-${number}` : `tcs-${kind}-${index}`);

  if (labelKey && refs) {
    refs[labelKey] = { type: meta.label, number, id };
  }

  return [
    `<section class="tcs-box tcs-${kind}" id="${id}">`,
    makeHeader(kind, title, number),
    `<div class="tcs-box-content">${bodyHtml}${proofQed}</div>`,
    '</section>',
  ].join('\n');
}

const TYPE_PLURALS = { Corollary: 'Corollaries' };

function pluralizeType(type) {
  return TYPE_PLURALS[type] || `${type}s`;
}

function joinNatural(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// Assign anchors and hierarchical numbers to headings, and record any that
// carry a \label{key} (inline or on the line directly below) so \Cref can
// link to them as "Section N".
function processHeadings(source, refs) {
  let minLevel = 6;
  source.replace(/^(#{1,6})[ \t]+\S/gm, (full, hashes) => {
    minLevel = Math.min(minLevel, hashes.length);
    return full;
  });

  const counters = [];
  const headingRe = /^(#{1,6})[ \t]+(.+?)[ \t]*(?:\n[ \t]*\\label\{([^}]+)\}[ \t]*)?$/gm;

  return source.replace(headingRe, (full, hashes, text, trailingLabel) => {
    const idx = hashes.length - minLevel;
    counters[idx] = (counters[idx] || 0) + 1;
    counters.length = idx + 1;
    const number = counters.join('.');

    const inline = text.match(/\\label\{([^}]+)\}/);
    const key = (trailingLabel || (inline && inline[1]) || '').trim();
    if (!key) return full;

    const cleanText = text.replace(/\\label\{[^}]+\}/g, '').trim();
    const id = makeSafeId(key);
    refs[key] = { type: 'Section', number, id };
    return `<span id="${id}" class="tcs-anchor"></span>\n\n${hashes} ${cleanText}`;
  });
}

function renderCrefGroup(group, capitalize) {
  if (group.missing) {
    return `<span class="tcs-ref tcs-ref-missing">[${escapeHtml(group.missing)}?]</span>`;
  }

  const plural = group.items.length > 1;
  const baseWord = plural ? pluralizeType(group.type) : group.type;
  const word = capitalize ? baseWord : baseWord.toLowerCase();

  if (group.items.length === 1) {
    const ref = group.items[0];
    const text = ref.number != null ? `${word} ${ref.number}` : word;
    return `<a class="tcs-ref" href="#${ref.id}">${escapeHtml(text)}</a>`;
  }

  const numbers = group.items.map(ref =>
    `<a class="tcs-ref" href="#${ref.id}">${escapeHtml(String(ref.number))}</a>`
  );
  return `${escapeHtml(word)} ${joinNatural(numbers)}`;
}

function renderCref(rawKeys, capitalize, refs) {
  const keys = rawKeys.split(',').map(key => key.trim()).filter(Boolean);
  const groups = [];

  for (const key of keys) {
    const ref = refs[key];
    if (!ref) {
      groups.push({ missing: key });
      continue;
    }

    const last = groups[groups.length - 1];
    if (last && !last.missing && last.type === ref.type) {
      last.items.push(ref);
    } else {
      groups.push({ type: ref.type, items: [ref] });
    }
  }

  return joinNatural(groups.map(group => renderCrefGroup(group, capitalize)));
}

function processCrossReferences(source, refs) {
  return source
    .replace(/\\([Cc])ref\{([^}]+)\}/g, (match, kase, rawKeys) => {
      return renderCref(rawKeys, kase === 'C', refs);
    })
    .replace(/\\label\{[^}]+\}\s*/g, '');
}

hexo.extend.filter.register('before_post_render', async function tcsElements(data) {
  if (!data || !data.content) return data;

  const counters = Object.fromEntries(Object.keys(ELEMENTS).map(kind => [kind, 0]));
  const refs = {};
  const algorithmState = { counter: 0, refs };
  const protectedContent = protectCodeFences(data.content, algorithmState);
  const fences = protectedContent.fences;
  const algorithms = processAlgorithms(protectedContent.content, algorithmState);
  const protectedHtml = protectExistingTcsHtml(algorithms);
  const existingHtml = protectedHtml.html;
  const papers = {};
  const citedKeys = [];
  const content = processPaperReferences(protectedHtml.content, papers, citedKeys);
  const boxes = [];

  async function render(kind, rawTitle, rawBody, index) {
    const normalizedKind = kind.toLowerCase();
    const labelMatch = rawBody.match(/\\label\{([^}]+)\}/);
    const labelKey = labelMatch ? labelMatch[1].trim() : '';
    const body = rawBody.replace(/\\label\{[^}]+\}/g, '').trim();
    const renderedBody = await hexo.render.render({
      text: protectMath(body),
      engine: 'markdown',
    });

    return wrapBox(normalizedKind, normalizeTitle(rawTitle), renderedBody.trim(), counters, labelKey, refs, index);
  }

  async function renderToken(kind, title, body) {
    const index = boxes.length;
    const token = `\u0000TCS_BOX_${index}\u0000`;
    boxes.push('');
    boxes[index] = await render(kind, title, body, index);
    return token;
  }

  let output = await replaceAsync(content, CONTAINER_RE, (match, kind, title, body) => {
    return renderToken(kind, title, body);
  });

  output = await replaceAsync(output, TEX_ENV_RE, (match, kind, title, body) => {
    return renderToken(kind, title, body);
  });

  output = processHeadings(output, refs);
  output = protectMath(output);
  output = output.replace(/\u0000TCS_BOX_(\d+)\u0000/g, (_, index) => boxes[Number(index)]);
  output = restoreExistingTcsHtml(output, existingHtml);
  output = processCrossReferences(output, refs);

  data.content = restoreCodeFences(output, fences);
  return data;
});
