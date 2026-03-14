export const config = { runtime: 'edge' };

const FREQ_NL = {
  once: 'Eenmalig', daily: 'Dagelijks', weekly: 'Wekelijks',
  monthly: 'Maandelijks', yearly: 'Jaarlijks',
};

const FREQ_EN = {
  once: 'One-time', daily: 'Daily', weekly: 'Weekly',
  monthly: 'Monthly', yearly: 'Yearly',
};

const UNIT_NL = { days: 'dagen', weeks: 'weken', months: 'maanden', years: 'jaar' };
const UNIT_EN = { days: 'days', weeks: 'weeks', months: 'months', years: 'years' };

function customLabelNL(interval, unit) {
  if (!interval || !unit) return null;
  const i = parseInt(interval, 10);
  if (isNaN(i) || i < 1) return null;
  const nlUnit = UNIT_NL[unit];
  if (!nlUnit) return null;
  if (i === 1) {
    const singular = { days: 'dag', weeks: 'week', months: 'maand', years: 'jaar' };
    return `Elke ${singular[unit]}`;
  }
  return `Elke ${i} ${nlUnit}`;
}

function customLabelEN(interval, unit) {
  if (!interval || !unit) return null;
  const i = parseInt(interval, 10);
  if (isNaN(i) || i < 1) return null;
  const enUnit = UNIT_EN[unit];
  if (!enUnit) return null;
  if (i === 1) {
    const singular = { days: 'day', weeks: 'week', months: 'month', years: 'year' };
    return `Every ${singular[unit]}`;
  }
  return `Every ${i} ${enUnit}`;
}

function isNL(req) {
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  return accept.startsWith('nl') || accept.includes(',nl') || accept.includes(', nl');
}

function parseTijd(t) {
  if (t && t.length === 4) return t.substring(0, 2) + ':' + t.substring(2, 4);
  return '';
}

function titelVanSlug(slug) {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts.length < 3 || parts[0] !== 'share') {
    return Response.redirect('https://seintje.eu', 302);
  }

  const slug = parts[1];
  const freq = parts[2];
  const params = new URLSearchParams(url.searchParams);
  params.delete('path'); // Vercel rewrite artifact

  const titel = titelVanSlug(slug);
  const tijd = parseTijd(params.get('t'));
  const nl = isNL(req);

  const freqLabel = freq === 'custom'
    ? (nl ? customLabelNL(params.get('i'), params.get('u')) : customLabelEN(params.get('i'), params.get('u')))
    : (nl ? FREQ_NL[freq] : FREQ_EN[freq]) || '';

  // OG title — branded per language
  const appName = nl ? 'Seintje' : 'Heads up';
  const ogTitle = `${appName}: ${titel}`;

  // OG description
  let ogDesc = '';
  if (tijd && freqLabel && freq !== 'once') {
    ogDesc = nl ? `${freqLabel} om ${tijd}` : `${freqLabel} at ${tijd}`;
  } else if (tijd) {
    ogDesc = nl ? `Om ${tijd}` : `At ${tijd}`;
  } else if (freqLabel) {
    ogDesc = freqLabel;
  } else {
    ogDesc = nl ? 'Open in de Seintje app' : 'Open in the Heads up app';
  }

  const qs = params.toString();
  const ogUrl = `https://seintje.eu/share/${slug}/${freq}${qs ? '?' + qs : ''}`;
  const ogImage = 'https://seintje.eu/img/app-icon.png';

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(ogTitle)}</title>
    <meta name="description" content="${esc(ogDesc)}">

    <!-- Open Graph -->
    <meta property="og:title" content="${esc(ogTitle)}">
    <meta property="og:description" content="${esc(ogDesc)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${esc(ogUrl)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="512">
    <meta property="og:image:height" content="512">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${esc(ogTitle)}">
    <meta name="twitter:description" content="${esc(ogDesc)}">
    <meta name="twitter:image" content="${ogImage}">

    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --accent: #FF3B6F;
            --accent-light: #FFF0F3;
            --accent-dark: #E0325F;
            --bg: #FAF9F7;
            --bg-white: #FFFFFF;
            --text: #1A1A1A;
            --text-secondary: #8A8680;
            --border: #EDEBE8;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--bg);
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .card {
            background: var(--bg-white);
            border-radius: 24px;
            padding: 40px 32px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06);
        }

        .logo {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            margin: 0 auto 24px;
        }

        .label {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: var(--accent);
            text-transform: uppercase;
            margin-bottom: 12px;
        }

        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.3;
            margin-bottom: 8px;
            word-break: break-word;
        }

        .details {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-bottom: 32px;
        }

        .badge {
            display: inline-block;
            background: var(--accent-light);
            color: var(--accent-dark);
            padding: 4px 12px;
            border-radius: 100px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-top: 8px;
        }

        .btn {
            display: block;
            width: 100%;
            padding: 14px 24px;
            border-radius: 14px;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }

        .btn-primary {
            background: var(--text);
            color: #fff;
            margin-bottom: 12px;
        }

        .btn-primary:hover { opacity: 0.88; }

        .btn-secondary {
            background: transparent;
            color: var(--text);
            border: 1.5px solid var(--border);
        }

        .btn-secondary:hover { border-color: var(--text-secondary); }

        .footer-text {
            margin-top: 24px;
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        .footer-text a { color: var(--text-secondary); }

        .seintje-info { display: none; }
        .seintje-info.geladen { display: block; }
    </style>
</head>
<body>

<div class="card">
    <img src="/img/app-icon.png" alt="Seintje" class="logo" onerror="this.style.display='none'">

    <div class="label" id="headerLabel">Seintje ontvangen</div>

    <div class="seintje-info" id="seintjeInfo">
        <h1 id="seintjeTitel"></h1>
        <div class="details">
            <span id="seintjeTijd"></span>
            <div id="seintjeBadge"></div>
        </div>
    </div>

    <noscript>
        <h1>${esc(titel)}</h1>
        <p class="details">${esc(ogDesc)}</p>
    </noscript>

    <a href="#" class="btn btn-primary" id="downloadBtn">
        Download Seintje
    </a>
    <a href="#" class="btn btn-secondary" id="openBtn" style="display: none;">
        Open in de app
    </a>

    <p class="footer-text">
        <a href="https://seintje.eu">seintje.eu</a>
    </p>
</div>

<script>
(function() {
    var isEN = (navigator.language || '').substring(0, 2) !== 'nl';

    var freqLabels = isEN
        ? { once:'One-time', daily:'Daily', weekly:'Weekly', monthly:'Monthly', yearly:'Yearly' }
        : { once:'Eenmalig', daily:'Dagelijks', weekly:'Wekelijks', monthly:'Maandelijks', yearly:'Jaarlijks' };

    var unitLabels = isEN
        ? { days:'days', weeks:'weeks', months:'months', years:'years' }
        : { days:'dagen', weeks:'weken', months:'maanden', years:'jaar' };
    var unitSingular = isEN
        ? { days:'day', weeks:'week', months:'month', years:'year' }
        : { days:'dag', weeks:'week', months:'maand', years:'jaar' };

    // Header
    document.getElementById('headerLabel').textContent = isEN ? 'Heads up received' : 'Seintje ontvangen';

    // Buttons
    document.getElementById('downloadBtn').textContent = isEN ? 'Download Heads up' : 'Download Seintje';
    document.getElementById('openBtn').textContent = isEN ? 'Open in app' : 'Open in de app';

    // Parse URL: /share/{slug}/{freq}?t=HHmm&...
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length < 3 || parts[0] !== 'share') return;

    var slug = decodeURIComponent(parts[1]);
    var freq = parts[2];
    var params = new URLSearchParams(window.location.search);

    var titel = slug.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
    var t = params.get('t');
    var tijdStr = (t && t.length === 4) ? t.substring(0, 2) + ':' + t.substring(2, 4) : '';
    var freqLabel = freqLabels[freq] || '';
    if (freq === 'custom') {
        var ci = params.get('i');
        var cu = params.get('u');
        if (ci && cu && unitLabels[cu]) {
            var n = parseInt(ci, 10);
            var prefix = isEN ? 'Every' : 'Elke';
            freqLabel = n === 1
                ? prefix + ' ' + unitSingular[cu]
                : prefix + ' ' + n + ' ' + unitLabels[cu];
        }
    }

    var info = document.getElementById('seintjeInfo');
    document.getElementById('seintjeTitel').textContent = titel;
    document.getElementById('seintjeTijd').textContent = tijdStr;

    if (freq !== 'once' && freqLabel) {
        document.getElementById('seintjeBadge').innerHTML = '<span class="badge">' + freqLabel + '</span>';
    }

    info.classList.add('geladen');

    // App URL via custom scheme
    var appUrl = 'seintje://s/' + slug + '/' + mapFreqToOld(freq) + '/ochtend' + window.location.search;

    // Open in app button
    var openBtn = document.getElementById('openBtn');
    openBtn.href = appUrl;
    openBtn.style.display = 'block';

    // Auto-redirect: try opening the app immediately
    // If the app is installed, it opens. If not, nothing visible happens.
    var start = Date.now();
    window.location.href = appUrl;

    // If still here after 1.5s, the app didn't open — just show the page
    setTimeout(function() {
        if (Date.now() - start < 2000) return; // app opened, ignore
    }, 1500);

    function mapFreqToOld(eng) {
        var map = { once:'eenmalig', daily:'dagelijks', weekly:'wekelijks',
                    monthly:'maandelijks', yearly:'jaarlijks', custom:'aangepast' };
        return map[eng] || eng;
    }
})();
</script>

</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Vary': 'Accept-Language',
    },
  });
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
