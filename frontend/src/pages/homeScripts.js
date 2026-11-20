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
