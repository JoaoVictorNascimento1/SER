document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('ser-form');
    const resultArea = document.getElementById('result-area');
    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        loadingDiv.classList.remove('hidden');
        submitBtn.disabled = true;
        resultArea.innerHTML = '';

        const formData = new FormData(form);

        try {
            const response = await fetch('/api/gerar-ser', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const zonas = await response.json();
            displayResult(zonas);

        } catch (error) {
            resultArea.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
            console.error('Falha na requisição:', error);
        } finally {
            loadingDiv.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    // ─── Helpers SVG ──────────────────────────────────────────────────────────────

    function svgEl(tag, attrs = {}, text = null) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (text !== null) el.textContent = text;
        return el;
    }

    function wordColor(cor) {
        if (cor === 'red')  return '#FF0000';
        if (cor === 'blue') return '#0000FF';
        return '#000000';
    }



    // ─── Cálculo de raio dinâmico por zona ────────────────────────────────────────

    function calcRadius(nWords, innerRadius, minArcPx = 75) {
        if (nWords === 0) return innerRadius + 80;
        const rMid = (nWords * minArcPx) / (2 * Math.PI);
        const outer = 2 * rMid - innerRadius;
        return Math.max(outer, innerRadius + 80);
    }

    // ─── Download como PNG ────────────────────────────────────────────────────────

    function downloadPNG(svgEl, filename, size) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgEl);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const a = document.createElement('a');
            a.download = filename;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = url;
    }

    // ─── Renderização principal ───────────────────────────────────────────────────

    function displayResult(zonas) {
        const zoneNames  = ['Núcleo Central', 'Intermediário 1', 'Intermediário 2', 'Periférico'];
        const zoneColors = ['#FF6347', '#FFD700', '#90EE90', '#87CEEB'];

        // Palavra com maior índice = primeira do Núcleo Central
        // (já vem ordenada por índice decrescente do backend)
        const topWord = (zonas['Núcleo Central'] || [])[0]?.word || null;

        // Raio dinâmico
        const nucleoWords  = (zonas['Núcleo Central'] || []).length;
        const nucleoRadius = Math.max(160, calcRadius(nucleoWords, 0, 90));
        const radii = [nucleoRadius];
        zoneNames.slice(1).forEach((name, i) => {
            const n = (zonas[name] || []).length;
            radii.push(calcRadius(n, radii[i]));
        });

        const margin = 60;
        const size   = (radii[3] + margin) * 2;
        const cx     = size / 2;
        const cy     = size / 2;

        // Cria SVG
        const svg = svgEl('svg', {
            width: size,
            height: size,
            viewBox: `0 0 ${size} ${size}`,
            xmlns: 'http://www.w3.org/2000/svg',
            style: 'background:#ffffff; max-width:100%; border:1px solid #dee2e6; border-radius:4px;'
        });

        svg.appendChild(svgEl('rect', { width: size, height: size, fill: '#ffffff' }));

        const zoneConfig = zoneNames.map((name, i) => ({ name, radius: radii[i], color: zoneColors[i] }));

        // Círculos tracejados
        zoneConfig.slice().reverse().forEach(zona => {
            svg.appendChild(svgEl('circle', {
                cx, cy,
                r: zona.radius,
                fill: 'none',
                stroke: '#AAAAAA',
                'stroke-width': '2',
                'stroke-dasharray': '5,10'
            }));
        });

        // Palavras e labels por zona
        zoneConfig.forEach((zona, i) => {
            const wordsInZone = zonas[zona.name];
            if (!wordsInZone) return;

            const innerRadius = i === 0 ? 0 : zoneConfig[i - 1].radius;
            const outerRadius = zona.radius;

            // Label da zona
            svg.appendChild(svgEl('text', {
                x: cx,
                y: cy - outerRadius + 20,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: zona.color,
                'font-family': 'Arial, sans-serif',
                'font-size': '15',
                'font-weight': 'bold'
            }, zona.name));

            // Demais zonas + Núcleo: mesmo layout circular
            wordsInZone.forEach((wd, idx) => {
                const isTop = wd.word === topWord;
                const ringDist = zona.name === 'Núcleo Central'
                    ? outerRadius * 0.72
                    : innerRadius + (outerRadius - innerRadius) / 2;
                const angle    = (idx * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
                const distance = ringDist;
                const x = cx + distance * Math.cos(angle);
                const y = cy + distance * Math.sin(angle);

                const bold = wd.cor === 'red' || wd.cor === 'blue' || isTop;

                svg.appendChild(svgEl('text', {
                    x, y,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: wordColor(wd.cor),
                    'font-family': 'Arial, sans-serif',
                    'font-size': '14',
                    'font-weight': bold ? 'bold' : 'normal',
                    'text-decoration': isTop ? 'underline' : 'none'
                }, wd.word));
            });
        });

        // Monta área de resultado
        resultArea.innerHTML = '<h2>Resultado do SER</h2>';
        resultArea.appendChild(svg);

        // Botão SVG
        const btnSVG = document.createElement('a');
        btnSVG.textContent = 'Baixar SVG';
        btnSVG.style.cssText = 'display:inline-block;margin:1rem 0.5rem 0;padding:0.5rem 1rem;background:#0d6efd;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer;';
        btnSVG.addEventListener('click', () => {
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(svg);
            const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'ser-resultado.svg';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Botão PNG
        const btnPNG = document.createElement('a');
        btnPNG.textContent = 'Baixar PNG';
        btnPNG.style.cssText = 'display:inline-block;margin:1rem 0.5rem 0;padding:0.5rem 1rem;background:#198754;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer;';
        btnPNG.addEventListener('click', () => downloadPNG(svg, 'ser-resultado.png', size));

        resultArea.appendChild(btnSVG);
        resultArea.appendChild(btnPNG);
    }
});