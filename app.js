// Nix Interactive Playground & Landing Page Controller
// Powered by real execution data from google/zx

document.addEventListener('DOMContentLoaded', () => {
  initHeroRotator();
  initPlayground();
  initFaqAccordion();
  initCopyButtons();
});

// 1. Hero Dynamic Emphasis Rotator
function initHeroRotator() {
  const rotatorEl = document.getElementById('hero-rotator');
  if (!rotatorEl) return;

  const phrases = [
    'Understand the codebase.',
    'Trace the architecture.',
    'Verify the answer.',
    'Retrieve the right context.'
  ];

  let currentIdx = 0;
  setInterval(() => {
    rotatorEl.style.opacity = '0';
    setTimeout(() => {
      currentIdx = (currentIdx + 1) % phrases.length;
      rotatorEl.textContent = phrases[currentIdx];
      rotatorEl.style.opacity = '1';
    }, 250);
  }, 3200);
}

// 2. Main Interactive Playground
function initPlayground() {
  const data = window.NIX_DATA;
  if (!data) return;

  let activeCommandKey = 'ask';
  let activeSubtab = 'terminal';

  const cmdButtons = document.querySelectorAll('.cmd-btn');
  const subtabButtons = document.querySelectorAll('.subtab-btn');
  const cmdDisplay = document.getElementById('viewer-cmd-text');
  const durationDisplay = document.getElementById('viewer-duration');
  const interactiveBar = document.getElementById('interactive-bar');
  const interactiveSelector = document.getElementById('interactive-selector');
  const interactiveLabel = document.getElementById('interactive-label');
  const terminalView = document.getElementById('terminal-view');
  const contextView = document.getElementById('context-view');
  const verificationView = document.getElementById('verification-view');
  const copyCmdBtn = document.getElementById('copy-cmd-btn');

  function render() {
    const cmdData = data.commands[activeCommandKey] || data.commands['ask'];

    // Update command buttons active state
    cmdButtons.forEach(btn => {
      if (btn.dataset.cmd === activeCommandKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update subtab buttons active state
    subtabButtons.forEach(btn => {
      if (btn.dataset.tab === activeSubtab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update top bar text
    if (cmdDisplay) cmdDisplay.textContent = `$ ${cmdData.cmd}`;
    if (durationDisplay) durationDisplay.textContent = cmdData.duration;

    // Handle secondary interactive selector (for ask questions and search queries)
    if (activeCommandKey === 'ask' && cmdData.allQuestions) {
      interactiveBar.style.display = 'flex';
      interactiveLabel.textContent = 'Question:';
      interactiveSelector.innerHTML = cmdData.allQuestions
        .map((q, i) => `<option value="${i}">${q.question}</option>`)
        .join('');
      interactiveSelector.onchange = (e) => {
        const selected = cmdData.allQuestions[e.target.value];
        if (selected) {
          cmdDisplay.textContent = `$ nix ask "${selected.question}"`;
          terminalView.querySelector('pre').textContent = selected.output;
          durationDisplay.textContent = selected.duration;
        }
      };
    } else if (activeCommandKey === 'search' && cmdData.allQueries) {
      interactiveBar.style.display = 'flex';
      interactiveLabel.textContent = 'Query:';
      interactiveSelector.innerHTML = cmdData.allQueries
        .map((s, i) => `<option value="${i}">${s.query}</option>`)
        .join('');
      interactiveSelector.onchange = (e) => {
        const selected = cmdData.allQueries[e.target.value];
        if (selected) {
          cmdDisplay.textContent = `$ nix search "${selected.query}"`;
          terminalView.querySelector('pre').textContent = selected.output;
          durationDisplay.textContent = selected.duration;
        }
      };
    } else {
      interactiveBar.style.display = 'none';
    }

    // Switch views
    if (activeSubtab === 'terminal') {
      terminalView.style.display = 'block';
      contextView.style.display = 'none';
      verificationView.style.display = 'none';
      terminalView.querySelector('pre').textContent = cmdData.output;
    } else if (activeSubtab === 'context') {
      terminalView.style.display = 'none';
      contextView.style.display = 'block';
      verificationView.style.display = 'none';
      renderContextView(cmdData);
    } else if (activeSubtab === 'verification') {
      terminalView.style.display = 'none';
      contextView.style.display = 'none';
      verificationView.style.display = 'block';
      renderVerificationView(cmdData);
    }
  }

  function renderContextView(cmdData) {
    if (!contextView) return;
    let html = `
      <div style="margin-bottom: 1.25rem;">
        <div style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.25rem;">Topological Source Evidence</div>
        <p style="font-size: 0.75rem; color: var(--text-muted);">Actual source files retrieved and grounded by Nix for this query.</p>
      </div>
    `;

    if (cmdData.filesRetrieved && cmdData.filesRetrieved.length > 0) {
      cmdData.filesRetrieved.forEach(f => {
        const path = typeof f === 'string' ? f : f.path;
        const lines = f.lines ? `Lines ${f.lines}` : (f.score ? `Score: ${f.score}` : '');
        const reason = f.reason || f.snippet || 'Retrieved from dependency graph';
        html += `
          <div class="evidence-file-card">
            <div class="evidence-file-header">
              <span style="font-weight: 600;">📄 ${path}</span>
              <span class="badge badge-neutral">${lines}</span>
            </div>
            <div class="evidence-file-body">
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">${reason}</div>
            </div>
          </div>
        `;
      });
    }

    if (cmdData.symbols && cmdData.symbols.length > 0) {
      html += `
        <div style="margin-top: 1.25rem;">
          <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Verified Symbols</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
            ${cmdData.symbols.map(s => `<span class="badge badge-neutral">${s}</span>`).join('')}
          </div>
        </div>
      `;
    }

    contextView.innerHTML = html;
  }

  function renderVerificationView(cmdData) {
    if (!verificationView) return;
    let html = `
      <div style="margin-bottom: 1.25rem;">
        <div style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.25rem;">Source-Grounded Verification Report</div>
        <p style="font-size: 0.75rem; color: var(--text-muted);">Nix verifies every architectural claim against the real google/zx AST index.</p>
      </div>
      <div class="verification-list">
    `;

    (cmdData.verification || []).forEach(v => {
      const isPass = v.status === 'PASS' || v.status === 'MATCH';
      const badgeClass = isPass ? 'badge-pass' : 'badge-warn';
      const icon = isPass ? '✓' : '⚠';
      html += `
        <div class="verification-item">
          <span class="badge ${badgeClass}">${icon} ${v.status}</span>
          <div>
            <div style="font-weight: 600; font-size: 0.8125rem;">${v.label}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">${v.detail}</div>
          </div>
        </div>
      `;
    });

    html += `
      </div>
      <div style="margin-top: 1.5rem; padding: 0.75rem; background: var(--bg-page); border: 1px solid var(--border-card); border-radius: var(--radius-md); font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
        Commit SHA: ${data.repo.commitShort} · 0 Hallucinations · 100% Source Backed
      </div>
    `;

    verificationView.innerHTML = html;
  }

  // Bind command clicks
  cmdButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCommandKey = btn.dataset.cmd;
      activeSubtab = 'terminal';
      render();
    });
  });

  // Bind subtab clicks
  subtabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubtab = btn.dataset.tab;
      render();
    });
  });

  // Bind copy command button
  if (copyCmdBtn) {
    copyCmdBtn.addEventListener('click', () => {
      const textToCopy = cmdDisplay ? cmdDisplay.textContent.replace(/^\$\s*/, '') : '';
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyCmdBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyCmdBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg> Copy
          `;
        }, 1500);
      });
    });
  }

  // Initial render
  render();
}

// 3. FAQ Accordion
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close other items
      faqItems.forEach(other => other.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

// 4. Code Copy Buttons
function initCopyButtons() {
  document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.dataset.code;
      if (!code) return;

      navigator.clipboard.writeText(code).then(() => {
        const origText = btn.innerHTML;
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.innerHTML = origText;
        }, 1500);
      });
    });
  });
}
