'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GlareHover from '../components/GlareHover';
import GradientText from '../components/GradientText';
import Silk from '../components/Silk';
import { ClickSpark, CountUp, FadeContent, Magnet, ScrollReveal, ShinyText, SpotlightCard } from '../components/ReactBitsExtras';

const FILE_PATH = '.github/workflows/sync-fork.yml';
const CRON_BY_INTERVAL = {
  hourly: '0 * * * *',
  sixHours: '0 */6 * * *',
  twelveHours: '0 */12 * * *',
  daily: '0 0 * * *',
  weekly: '0 0 * * 0',
};

function isValidBranchName(branch) {
  return Boolean(branch)
    && !/[\u0000-\u0020~^:?*[\\]/.test(branch)
    && !branch.startsWith('/')
    && !branch.endsWith('/')
    && !branch.endsWith('.')
    && !branch.includes('//')
    && !branch.includes('..')
    && !branch.includes('@{')
    && branch.split('/').every((part) => part && !part.startsWith('.') && !part.endsWith('.lock'));
}

function validate(values) {
  const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  const secretPattern = /^[A-Z_][A-Z0-9_]*$/;
  const upstream = values.upstream.trim();
  const branch = values.branch.trim();
  const secret = values.secret.trim();

  return {
    upstream: !upstream
      ? 'Enter the original repository as owner/repo.'
      : repoPattern.test(upstream) ? '' : 'Use owner/repo format, for example facebook/react.',
    branch: !branch
      ? 'Enter the branch you want to sync.'
      : isValidBranchName(branch) ? '' : 'Enter a valid Git branch name, such as main or release/1.x.',
    secret: values.usePat && !secretPattern.test(secret)
      ? 'Use uppercase letters, numbers, and underscores. Start with a letter or underscore.'
      : '',
  };
}

function buildCron(interval) {
  return CRON_BY_INTERVAL[interval] || CRON_BY_INTERVAL.twelveHours;
}

function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function buildYaml(values) {
  const token = values.usePat
    ? `\${{ secrets.${values.secret.trim()} }}`
    : '\${{ secrets.GITHUB_TOKEN }}';
  const forceFlag = values.forceSync ? ' --force' : '';

  return `name: Sync Fork

on:
  schedule:
    - cron: '${buildCron(values.interval)}'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync fork with upstream
        env:
          GH_TOKEN: ${token}
        run: gh repo sync "\${{ github.repository }}" --source ${shellQuote(values.upstream.trim())} --branch ${shellQuote(values.branch.trim())}${forceFlag}
`;
}

function renderYamlValue(value) {
  const tokenPattern = /\$\{\{.*?\}\}|'(?:[^']|'')*'|\b(?:write|ubuntu-latest)\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index));
    const token = match[0];
    const tokenClass = token.startsWith('${{')
      ? 'yaml-expression'
      : token.startsWith("'") ? 'yaml-string' : 'yaml-literal';
    parts.push(<span className={tokenClass} key={`${match.index}-${token}`}>{token}</span>);
    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < value.length) parts.push(value.slice(lastIndex));
  return parts;
}

function renderYamlLine(line, index) {
  const keyMatch = /^(\s*(?:-\s*)?)([A-Za-z_][\w-]*:)(\s*)(.*)$/.exec(line);
  let content = line;

  if (keyMatch) {
    content = <>{keyMatch[1]}<span className="yaml-key">{keyMatch[2]}</span>{keyMatch[3]}{renderYamlValue(keyMatch[4])}</>;
  } else {
    content = renderYamlValue(line);
  }

  return (
    <span className="code-line" key={index}>
      <span className="line-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span className="line-content">{content || ' '}</span>
    </span>
  );
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" />,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v3h14v-3" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function Home() {
  const [values, setValues] = useState({
    upstream: '',
    branch: 'main',
    interval: 'twelveHours',
    forceSync: false,
    usePat: false,
    secret: 'SYNC_TOKEN',
  });
  const [touched, setTouched] = useState({});
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  const errors = useMemo(() => validate(values), [values]);
  const isValid = !errors.upstream && !errors.branch && !errors.secret;
  const yaml = useMemo(() => isValid ? buildYaml(values) : '', [isValid, values]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function copy() {
    if (!isValid) return;
    try {
      await navigator.clipboard.writeText(yaml);
    } catch {
      const temporary = document.createElement('textarea');
      temporary.value = yaml;
      temporary.setAttribute('readonly', '');
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.appendChild(temporary);
      temporary.select();
      const succeeded = document.execCommand('copy');
      temporary.remove();
      if (!succeeded) return;
    }
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
  }

  function download() {
    if (!isValid) return;
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sync-fork.yml';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const stepList = [
    <>Open your fork on <a href="https://github.com" target="_blank" rel="noreferrer">GitHub <Icon name="arrow" size={13} /></a>.</>,
    <>Choose <strong>Add file</strong>, then <strong>Create new file</strong>.</>,
    <>Set the filename to <code className="inline-code">{FILE_PATH}</code>.</>,
    <>Paste the generated YAML and commit it to <code className="inline-code">{values.branch.trim() || 'your branch'}</code>.</>,
    <>Open <strong>Actions</strong> and select <strong>“I understand my workflows, go ahead and enable them”</strong>. Scheduled workflows are off by default on forks.</>,
    <>Choose <strong>Sync Fork</strong> in the sidebar, then <strong>Run workflow</strong> to test it.</>,
    ...(values.usePat ? [<>Create a Personal Access Token with <code className="inline-code">repo</code> and <code className="inline-code">workflow</code> scopes. Add it under <strong>Settings → Secrets and variables → Actions</strong> as <code className="inline-code">{values.secret.trim() || 'SYNC_TOKEN'}</code>.</>] : []),
    <>Done. Your fork will sync automatically every <strong>{values.interval === 'weekly' ? 'week' : values.interval === 'daily' ? '24 hours' : values.interval === 'twelveHours' ? '12 hours' : values.interval === 'sixHours' ? '6 hours' : 'hour'}</strong>.</>,
  ];

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fork Sync home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 4v13m0-7h5a4 4 0 0 0 4-4m-9 7h5a4 4 0 0 1 4 4" /><circle cx="7" cy="4" r="2" /><circle cx="7" cy="19" r="2" /><circle cx="16" cy="4" r="2" /><circle cx="16" cy="19" r="2" /></svg></span>
          <span>fork<span className="brand-light">sync</span></span>
        </a>
        <nav className="top-nav" aria-label="Page sections">
          <a href="#workflow-preview">The workflow</a>
          <a href="#setup-steps">Setup guide</a>
        </nav>
      </header>

      <section className="hero-section" id="top" aria-labelledby="page-title">
        <div className="hero-atmosphere" aria-hidden="true">
          <Silk color="#8f2637" sheenColor="#ff7b73" speed={0.24} scale={1.25} noiseIntensity={1.1} rotation={-9} sheen={0.24} depth={0.58} glow={0.2} ripple={0.6} wave={0.52} variation={2} interactionStrength={0.34} clickRipple={false} intro fade={0} className="hero-silk" />
          <span className="hero-light-orb" />
          <span className="hero-grid-lines" />
        </div>
        <div className="hero-copy">
          <div className="hero-kicker"><span className="hero-kicker-mark" /> <ShinyText>OPEN SOURCE TOOL</ShinyText> <span className="hero-kicker-divider">/</span> GITHUB ACTIONS</div>
          <h1 id="page-title" className="hero-title">
            <span>Your fork.</span>
            <span className="title-changing">Always <GradientText colors={['#ffe1d8', '#ff7a75', '#d63d4f']} animationSpeed={7} variant="linear" angle={90} scale={2.2} glow={0.22} className="hero-gradient-word">current.</GradientText></span>
          </h1>
          <p className="hero-description">A small, dependable workflow that brings upstream changes into your fork—on your schedule, right inside GitHub.</p>
          <div className="hero-actions">
            <Magnet className="hero-magnet" strength={7}>
              <GlareHover className="hero-cta-glare" background="var(--accent)" borderColor="var(--accent)" borderRadius="8px" glareColor="#fff3ee" glareOpacity={0.3} glareSize={24} transitionDuration={460}>
                <ClickSpark className="hero-click-spark"><a className="hero-cta" href="#workflow-builder">Build my workflow <Icon name="arrow" size={16} /></a></ClickSpark>
              </GlareHover>
            </Magnet>
            <span className="hero-cta-note">No GitHub connection needed</span>
          </div>
          <div className="hero-proof">
            <span className="hero-proof-mark"><Icon name="check" size={12} /></span>
            <span className="hero-proof-text">One workflow. No extra service.</span>
          </div>
          <div className="hero-route" aria-label="Workflow summary">
            <span><small>FROM</small><strong>Upstream</strong></span><span className="route-line" aria-hidden="true"><i /></span><span><small>TO</small><strong>Your fork</strong></span><span className="route-schedule"><span className="route-pulse" /> Every {values.interval === 'weekly' ? 'week' : values.interval === 'daily' ? '24 hours' : values.interval === 'twelveHours' ? '12 hours' : values.interval === 'sixHours' ? '6 hours' : 'hour'}</span>
          </div>
        </div>

        <SpotlightCard id="workflow-builder" className="setup-card setup-card-enter" aria-labelledby="setup-title">
          <div className="card-topline"><span className="step-kicker">01 <span className="card-kicker-divider">/</span> CONFIGURE</span><span className="card-indicator"><span /> <ShinyText>LIVE PREVIEW</ShinyText><span className="card-kicker-divider">·</span><CountUp value={5} /> SCHEDULES</span></div>
          <h2 id="setup-title">Start with the source.</h2>
          <p className="card-intro">Choose the upstream repository and sync settings.</p>

          <form className="config-form" onSubmit={(event) => event.preventDefault()} noValidate>
            <div className="field-group">
              <label htmlFor="upstream">Upstream repository</label>
              <div className={`input-wrap ${touched.upstream && errors.upstream ? 'has-error' : ''}`}>
                <span className="input-prefix" aria-hidden="true">github.com /</span>
                <input id="upstream" name="upstream" type="text" autoComplete="off" autoCapitalize="none" spellCheck="false" placeholder="owner/repo" value={values.upstream} onChange={(event) => update('upstream', event.target.value)} onBlur={() => markTouched('upstream')} aria-invalid={Boolean(touched.upstream && errors.upstream)} aria-describedby="upstream-help upstream-error" />
              </div>
              <div className="field-hint-row"><span id="upstream-help" className="field-hint">The original repository your fork comes from.</span><span id="upstream-error" className="field-error" aria-live="polite">{touched.upstream ? errors.upstream : ''}</span></div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label htmlFor="branch">Branch</label>
                <input id="branch" name="branch" type="text" autoComplete="off" spellCheck="false" placeholder="main" value={values.branch} onChange={(event) => update('branch', event.target.value)} onBlur={() => markTouched('branch')} aria-invalid={Boolean(touched.branch && errors.branch)} aria-describedby="branch-error" />
                <span id="branch-error" className="field-error" aria-live="polite">{touched.branch ? errors.branch : ''}</span>
              </div>
              <div className="field-group">
                <label htmlFor="interval">Sync frequency</label>
                <div className="select-wrap">
                  <select id="interval" name="interval" value={values.interval} onChange={(event) => update('interval', event.target.value)}>
                    <option value="hourly">Every 1 hour</option>
                    <option value="sixHours">Every 6 hours</option>
                    <option value="twelveHours">Every 12 hours</option>
                    <option value="daily">Every 24 hours</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <span className="select-chevron" aria-hidden="true">⌄</span>
                </div>
              </div>
            </div>

            <div className="option-list">
              <label className="option-row" htmlFor="force-sync">
                <input id="force-sync" type="checkbox" checked={values.forceSync} onChange={(event) => update('forceSync', event.target.checked)} />
                <span className="custom-check" aria-hidden="true"><Icon name="check" size={13} /></span>
                <span className="option-copy"><strong>Force sync</strong><small>Replace your branch if it has diverged.</small></span>
                <span className="option-tag">OPTIONAL</span>
              </label>
              {values.forceSync && <div className="warning-note" role="note"><span aria-hidden="true">!</span><p>This overwrites the fork’s <code>{values.branch.trim() || 'branch'}</code> and discards commits made directly on it.</p></div>}

              <label className="option-row" htmlFor="use-pat">
                <input id="use-pat" type="checkbox" checked={values.usePat} onChange={(event) => update('usePat', event.target.checked)} />
                <span className="custom-check" aria-hidden="true"><Icon name="check" size={13} /></span>
                <span className="option-copy"><strong>Upstream changes workflow files</strong><small>Use a personal access token for .github/workflows.</small></span>
                <span className="option-tag">TOKEN</span>
              </label>
              {values.usePat && <div className="secret-field field-group">
                <label htmlFor="secret-name">Secret name</label>
                <input id="secret-name" type="text" autoComplete="off" spellCheck="false" value={values.secret} onChange={(event) => update('secret', event.target.value)} onBlur={() => markTouched('secret')} aria-invalid={Boolean(touched.secret && errors.secret)} aria-describedby="secret-error" />
                <span id="secret-error" className="field-error" aria-live="polite">{touched.secret ? errors.secret : ''}</span>
              </div>}
            </div>
          </form>
        </SpotlightCard>
      </section>

      <section className="output-section" id="workflow-preview" aria-labelledby="output-title">
        <div className="section-heading">
          <div><span className="step-kicker">02 — YOUR WORKFLOW</span><ScrollReveal><h2 id="output-title">Ready to add to GitHub.</h2></ScrollReveal></div>
          <p>Review the file, then copy it or save it straight to your computer.</p>
        </div>

        <div className="output-card output-card-enter">
          <div className="code-header">
            <div className="file-label"><span className="file-glyph" aria-hidden="true">Y</span><span>{FILE_PATH}</span><span className="file-type">YAML</span></div>
            <div className="code-actions">
              <button className="button button-quiet" type="button" onClick={copy} disabled={!isValid} aria-label={copied ? 'Workflow copied' : 'Copy workflow YAML'}>
                <Icon name={copied ? 'check' : 'copy'} size={15} /> <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <GlareHover className="download-glare" background="var(--accent)" borderColor="var(--accent)" borderRadius="8px" glareColor="#fff3ee" glareOpacity={0.26} glareSize={24} transitionDuration={460}>
                <ClickSpark className="button-click-spark"><button className="button button-accent" type="button" onClick={download} disabled={!isValid}>
                  <Icon name="download" size={16} /> <span>Download .yml</span>
                </button></ClickSpark>
              </GlareHover>
            </div>
          </div>
          <div className="code-body">
            {isValid
              ? <pre className="code-scroll" aria-label="Generated GitHub Actions YAML"><code>{yaml.split('\n').slice(0, -1).map(renderYamlLine)}</code></pre>
              : <div className="empty-code"><span className="empty-code-mark" aria-hidden="true">↳</span><div><strong>Your workflow will appear here.</strong><span>Enter an upstream repository to generate the YAML.</span></div></div>}
          </div>
          <div className="output-footer"><span><span className="footer-dot" /> Updates live with your settings</span><span>Scheduled runs use UTC <span className="utc-info" title="GitHub cron schedules are interpreted in Coordinated Universal Time.">i</span></span></div>
        </div>
      </section>

      <section className="steps-section" id="setup-steps" aria-labelledby="steps-title">
        <div className="steps-intro">
          <span className="step-kicker">03 — PUBLISH & TEST</span>
          <h2 id="steps-title">One commit, then you’re set.</h2>
          <p>Add the generated workflow to your fork and run it once. After that, GitHub keeps it moving.</p>
          <details className="troubleshooting">
            <summary><span>Something not working?</span><span className="summary-icon" aria-hidden="true">+</span></summary>
            <div className="trouble-content">
              <div><strong>Branches have diverged</strong><p>Keep your commits on another branch, then sync normally — or enable force sync to replace this branch.</p></div>
              <div><strong>Workflow files are not syncing</strong><p>Enable the personal access token option and save a token with <code>repo</code> and <code>workflow</code> scopes.</p></div>
              <div><strong>The schedule stopped running</strong><p>GitHub disables scheduled workflows after 60 days of repository inactivity. Re-enable the workflow in the Actions tab.</p></div>
              <div><strong>Prefer no code?</strong><p>The free <a href="https://github.com/apps/pull" target="_blank" rel="noreferrer">Pull GitHub app <Icon name="arrow" size={12} /></a> is a no-code alternative.</p></div>
            </div>
          </details>
        </div>

        <FadeContent className="steps-list" aria-label="Setup instructions">
          {stepList.map((step, index) => (
            <div className={`instruction-step ${index === stepList.length - 1 ? 'final-step' : ''}`} key={index}>
              <div className="step-marker"><span>{String(index + 1).padStart(2, '0')}</span></div>
              <div className="step-text">{step}</div>
            </div>
          ))}
        </FadeContent>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 4v13m0-7h5a4 4 0 0 0 4-4m-9 7h5a4 4 0 0 1 4 4" /><circle cx="7" cy="4" r="2" /><circle cx="7" cy="19" r="2" /><circle cx="16" cy="4" r="2" /><circle cx="16" cy="19" r="2" /></svg></span><span>fork<span className="brand-light">sync</span></span></a>
        <span>Made to keep the useful bits flowing.</span>
        <a href="https://docs.github.com/en/actions" target="_blank" rel="noreferrer">GitHub Actions docs <Icon name="arrow" size={12} /></a>
      </footer>
    </main>
  );
}
