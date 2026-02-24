async function init() {
    const res = await fetch('content.json');
    const data = await res.json();
    document.getElementById('deck-title').textContent = data.meta.title;
    render(data.slides);
    setupScroll();
    setupKeys();
    setupPdf();
    setOffset();
}

function setOffset() {
    const height = document.querySelector('.top-nav').offsetHeight;
    document.documentElement.style.setProperty('--topOffset', height + 'px');
}

function render(slides) {
    const container = document.getElementById('deck-container');
    container.innerHTML = slides.map((s, i) => {
        let body = `<h1 data-animate>${s.headline}</h1>`;
        if (s.subheadline) body += `<p class="sub" data-animate="delay-1">${s.subheadline}</p>`;
        
        if (s.type === 'beforeAfter') {
            body += `<div class="grid" data-animate="delay-2">
                <div class="card"><h3>${s.left.title}</h3><ul>${s.left.bullets.map(b=>`<li>${b}</li>`).join('')}</ul></div>
                <div class="card"><h3>${s.right.title}</h3><ul>${s.right.bullets.map(b=>`<li>${b}</li>`).join('')}</ul></div>
            </div>`;
        } else if (s.bullets) {
            body += `<ul data-animate="delay-2">${s.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`;
        }
        
        return `<section class="slide slide-${s.type}" id="slide-${i}">${body}</section>`;
    }).join('');
}

function setupScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('is-active'); });
    }, { threshold: 0.5 });
    document.querySelectorAll('.slide').forEach(s => observer.observe(s));
}

function setupKeys() {
    window.addEventListener('keydown', e => {
        const slides = document.querySelectorAll('.slide');
        let current = Math.round(document.getElementById('deck-container').scrollTop / window.innerHeight);
        if (['ArrowDown', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
            if (current < slides.length - 1) slides[current + 1].scrollIntoView({ behavior: 'smooth' });
        } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
            e.preventDefault();
            if (current > 0) slides[current - 1].scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function setupPdf() {
    const btn = document.getElementById('exportPdfBtn');
    btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = "Exporting...";
        document.body.classList.add('exportingPdf');
        
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            
            const pdf = new jspdf.jsPDF({ orientation: 'l', unit: 'px', format: [1920, 1080] });
            const slides = document.querySelectorAll('.slide');
            const stage = document.getElementById('pdfStage');

            for (let i = 0; i < slides.length; i++) {
                stage.innerHTML = '';
                const clone = slides[i].cloneNode(true);
                clone.classList.add('is-active');
                stage.appendChild(clone);
                
                const canvas = await html2canvas(stage, { scale: 2, backgroundColor: '#0a0b14' });
                if (i > 0) pdf.addPage([1920, 1080], 'l');
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1920, 1080);
            }
            pdf.save('FlowPitch.pdf');
        } catch (e) {
            alert("CDN blocked or network error.");
        } finally {
            btn.disabled = false;
            btn.textContent = "Export PDF";
            document.body.classList.remove('exportingPdf');
        }
    };
}

function loadScript(src) {
    return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; document.head.appendChild(s);
    });
}

init();