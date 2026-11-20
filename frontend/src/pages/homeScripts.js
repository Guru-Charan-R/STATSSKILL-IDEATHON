export const homeScripts = `

    // Scroll-triggered Reveal Animations via IntersectionObserver
    document.addEventListener('DOMContentLoaded', () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      document.querySelectorAll('.reveal-node').forEach(node => {
        observer.observe(node);
      });
    });

    // Role Switcher Tab Logic
    function switchRole(role) {
      const roles = ['admin', 'trainer', 'trainee'];
      roles.forEach(r => {
        const btn = document.getElementById(\`role-btn-\${r}\`);
        const panel = document.getElementById(\`role-panel-\${r}\`);
        if (r === role) {
          btn.classList.add('bg-surface-pure', 'text-on-surface', 'shadow-xs', 'font-semibold');
          btn.classList.remove('text-on-surface-variant');
          btn.setAttribute('aria-selected', 'true');
          panel.classList.remove('hidden');
        } else {
          btn.classList.remove('bg-surface-pure', 'text-on-surface', 'shadow-xs', 'font-semibold');
          btn.classList.add('text-on-surface-variant');
          btn.setAttribute('aria-selected', 'false');
          panel.classList.add('hidden');
        }
      });
    }

    // AI Query handler micro-interaction
    function handleAiQuery(e) {
      e.preventDefault();
      const input = document.getElementById('ai-prompt-input');
      const toast = document.getElementById('ai-toast');
      if (input.value.trim() !== '') {
        toast.classList.remove('hidden');
        toast.innerText = \`StatSkill AI: Synthesizing analytical memorandum for "\${input.value.slice(0, 38)}..."\`;
        input.value = '';
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 5000);
      }
    }

    // Curricula Search and Filter Engine
    function filterCurricula() {
      const search = document.getElementById('curricula-search').value.toLowerCase();
      const cadre = document.getElementById('filter-cadre').value;
      const method = document.getElementById('filter-methodology').value;
      const cards = document.querySelectorAll('.curricula-card');

      cards.forEach(card => {
        const cardCadre = card.getAttribute('data-cadre');
        const cardMethod = card.getAttribute('data-method');
        const cardText = card.innerText.toLowerCase();

        const matchesSearch = search === '' || cardText.includes(search);
        const matchesCadre = cadre === 'all' || cardCadre === cadre;
        const matchesMethod = method === 'all' || cardMethod === method;

        if (matchesSearch && matchesCadre && matchesMethod) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    function resetFilters() {
      document.getElementById('curricula-search').value = '';
      document.getElementById('filter-cadre').value = 'all';
      document.getElementById('filter-methodology').value = 'all';
      filterCurricula();
    }

    // Download a plain-text audit summary (works offline, no HTML).
    function downloadAuditReport() {
      const lines = [
        'StatSkill AI - Evaluation Audit Summary',
        'SIH26101 | Government of India - MOSPI',
        'Generated: ' + new Date().toLocaleString(),
        '',
        'Evaluation audited under MoSPI Technical Advisory Group (TAG) protocols.',
        '',
        'Competency Scores',
        '-----------------',
        'CPI Hedonic Adjustments: 91.4%',
        'Administrative Data Harmonization: 85.6%',
        '',
        'This is a prototype audit summary generated locally by the StatSkill AI portal.',
        'Official records should be obtained from the MoSPI technical advisory group.'
      ];
      const text = lines.join('\\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'StatSkill_Audit_Summary.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 10000);
      if (typeof triggerAction === 'function') triggerAction('Audit summary downloaded as a text file.');
    }

    // Governance workflow bridges: the static home markup dispatches events
    // consumed by the React ledger drawer and the policy auditor.
    function openCert(mode, cohort) {
      window.dispatchEvent(new CustomEvent('open-cert-ledger', { detail: { mode: mode || 'registry', cohort: cohort || '' } }));
    }
    function openAuditor(preset) {
      window.dispatchEvent(new CustomEvent('open-policy-auditor', { detail: { preset: preset || 'sampling' } }));
    }
    function openLab() {
      window.location.assign('/quizzes');
    }

    function toggleCohortFilter() {
      const panel = document.getElementById('cohort-filter-panel');
      if (panel) { panel.remove(); return; }
      const host = document.querySelector('table');
      if (!host) return;
      const bar = document.createElement('div');
      bar.id = 'cohort-filter-panel';
      bar.className = 'p-space-sm bg-canvas-slate border-b border-border-subtle flex flex-wrap gap-2';
      bar.innerHTML = '<input id="cohort-filter-text" placeholder="Filter by cohort, division or module..." class="flex-1 min-w-[220px] px-3 py-1.5 text-xs rounded border border-border-strong bg-surface-pure text-on-surface">' +
        '<button id="cohort-filter-clear" class="px-3 py-1.5 text-xs font-semibold rounded border border-border-strong text-on-surface">Clear</button>';
      host.parentElement.insertBefore(bar, host);
      const input = bar.querySelector('#cohort-filter-text');
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        host.querySelectorAll('tbody tr').forEach(tr => {
          tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
      });
      bar.querySelector('#cohort-filter-clear').onclick = () => { input.value = ''; input.dispatchEvent(new Event('input')); };
      input.focus();
    }

    function enrollCadre() {
      const wrap = document.createElement('div');
      wrap.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4';
      wrap.innerHTML = '<div class="w-full max-w-md bg-surface-pure rounded-xl border border-border-subtle p-5 shadow-2xl">' +
        '<h3 class="font-title-md text-title-md text-on-surface mb-1">Enroll New Cadre</h3>' +
        '<p class="text-xs text-on-surface-variant mb-4">Register a new statistical cadre cohort for the accreditation matrix.</p>' +
        '<form id="enroll-form" class="space-y-3">' +
        '<input name="code" required placeholder="Cohort ID (e.g. ISS-2026-EZ)" class="w-full px-3 py-2 text-sm rounded border border-border-strong bg-canvas-slate text-on-surface">' +
        '<input name="division" required placeholder="Division / Zonal HQ" class="w-full px-3 py-2 text-sm rounded border border-border-strong bg-canvas-slate text-on-surface">' +
        '<input name="module" required placeholder="Curriculum module" class="w-full px-3 py-2 text-sm rounded border border-border-strong bg-canvas-slate text-on-surface">' +
        '<div class="flex justify-end gap-2 pt-2">' +
        '<button type="button" data-close class="px-3 py-2 text-xs font-semibold rounded border border-border-strong text-on-surface">Cancel</button>' +
        '<button type="submit" class="px-4 py-2 text-xs font-bold rounded bg-on-tertiary-container text-on-primary">Enroll cohort</button>' +
        '</div></form></div>';
      document.body.appendChild(wrap);
      wrap.querySelector('[data-close]').onclick = () => wrap.remove();
      wrap.querySelector('#enroll-form').onsubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const tbody = document.querySelector('table tbody');
        if (tbody) {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-canvas-slate/60 transition-colors';
          tr.innerHTML = '<td class="py-3.5 px-space-md"><div class="flex flex-col"><span class="font-semibold font-label-md">' + data.get('code') + '</span><span class="text-xs text-on-surface-variant">' + data.get('division') + '</span></div></td>' +
            '<td class="py-3.5 px-space-md"><span class="font-medium">' + data.get('module') + '</span></td>' +
            '<td class="py-3.5 px-space-md"><span class="tabular-nums font-medium">0 Officers</span></td>' +
            '<td class="py-3.5 px-space-md"><span class="text-xs text-on-surface-variant">Not started</span></td>' +
            '<td class="py-3.5 px-space-md"><span class="text-xs text-on-surface-variant">—</span></td>' +
            '<td class="py-3.5 px-space-md text-right"><button class="px-2.5 py-1 text-xs font-semibold rounded bg-on-tertiary-container text-on-primary" onclick="openCert(\\'issue\\', \\'' + data.get('code') + '\\')">Issue Certificate</button></td>';
          tbody.appendChild(tr);
        }
        wrap.remove();
        triggerAction('Cohort ' + data.get('code') + ' enrolled in the accreditation matrix.');
      };
    }

    // Portal Toast Helper
    function triggerAction(message) {
      const toast = document.getElementById('portal-toast');
      const toastMsg = document.getElementById('portal-toast-msg');
      toastMsg.innerText = message;
      toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      }, 3500);
    }
  
`;
