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

    function buildDiamondRows(total) {
        let rows = [1];
        let maxPerRow = 1;

        while (rows.reduce((a, b) => a + b, 0) < total) {
            maxPerRow++;
            rows = [];
            for (let i = 1; i <= maxPerRow; i++) rows.push(i);
            for (let i = maxPerRow - 1; i >= 1; i--) rows.push(i);
        }

        return rows;
    }

    function drawNucleoEmLosango(ctx, words, centerX, centerY, radius) {
        const rows = buildDiamondRows(words.length);
        const totalRows = rows.length;

        const lineHeight = Math.min(26, (radius * 1.7) / totalRows);
        const totalHeight = lineHeight * (totalRows - 1);
        const startY = centerY - totalHeight / 2;

        let wordIndex = 0;

        rows.forEach((colsInRow, rowIdx) => {
            if (wordIndex >= words.length) return;

            const y = startY + rowIdx * lineHeight;
            const rowWidth = Math.min(radius * 1.6, colsInRow * 80);
            const colSpacing = colsInRow === 1 ? 0 : rowWidth / (colsInRow - 1);
            const rowStartX = centerX - rowWidth / 2;

            for (let col = 0; col < colsInRow; col++) {
                if (wordIndex >= words.length) break;

                const wordData = words[wordIndex];
                const x = colsInRow === 1 ? centerX : rowStartX + col * colSpacing;

                if (wordData.cor === 'red') {
                    ctx.fillStyle = '#FF0000';
                    ctx.font = 'bold 15px Arial';
                } else if (wordData.cor === 'blue') {
                    ctx.fillStyle = '#0000FF';
                    ctx.font = 'bold 15px Arial';
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                }

                ctx.fillText(wordData.word, x, y);
                wordIndex++;
            }
        });
    }

    function calcRadius(nWords, innerRadius, minArcPx = 75) {
        if (nWords === 0) return innerRadius + 80;
        const rMid = (nWords * minArcPx) / (2 * Math.PI);
        const outer = 2 * rMid - innerRadius;
        return Math.max(outer, innerRadius + 80);
    }

    function displayResult(zonas) {
        const zoneNames = ['Núcleo Central', 'Intermediário 1', 'Intermediário 2', 'Periférico'];
        const zoneColors = ['#FF6347', '#FFD700', '#90EE90', '#87CEEB'];

        // Núcleo Central: baseado no losango, não em circunferência
        const nucleoWords = (zonas['Núcleo Central'] || []).length;
        const nucleoRadius = Math.max(160, nucleoWords * 18);

        const radii = [nucleoRadius];
        zoneNames.slice(1).forEach((name, i) => {
            const n = (zonas[name] || []).length;
            const inner = radii[i];
            radii.push(calcRadius(n, inner));
        });

        const margin = 60;
        const canvasSize = (radii[3] + margin) * 2;

        resultArea.innerHTML = `
            <h2>Resultado do SER</h2>
            <canvas id="ser-canvas" width="${canvasSize}" height="${canvasSize}"></canvas>
            <a id="download-btn" href="#" download="ser-resultado.png">Baixar Imagem</a>
        `;

        const canvas = document.getElementById('ser-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        const zoneConfig = zoneNames.map((name, i) => ({
            name,
            radius: radii[i],
            color: zoneColors[i]
        }));

        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);

        zoneConfig.slice().reverse().forEach(zona => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, zona.radius, 0, 2 * Math.PI);
            ctx.stroke();
        });

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        zoneConfig.forEach((zona, i) => {
            const wordsInZone = zonas[zona.name];
            if (!wordsInZone) return;

            const innerRadius = i === 0 ? 0 : zoneConfig[i - 1].radius;
            const outerRadius = zona.radius;

            ctx.font = 'bold 15px Arial';
            ctx.fillStyle = zona.color;
            ctx.fillText(zona.name, centerX, centerY - outerRadius + 18);

            if (zona.name === 'Núcleo Central') {
                drawNucleoEmLosango(ctx, wordsInZone, centerX, centerY, outerRadius);
                return;
            }

            wordsInZone.forEach((wordData, wordIndex) => {
                const angle = (wordIndex * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
                const distance = innerRadius + (outerRadius - innerRadius) / 2;
                const x = centerX + distance * Math.cos(angle);
                const y = centerY + distance * Math.sin(angle);

                if (wordData.cor === 'red') {
                    ctx.fillStyle = '#FF0000';
                    ctx.font = 'bold 15px Arial';
                } else if (wordData.cor === 'blue') {
                    ctx.fillStyle = '#0000FF';
                    ctx.font = 'bold 15px Arial';
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                }

                ctx.fillText(wordData.word, x, y);
            });
        });

        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.href = canvas.toDataURL('image/png');

        canvas.style.maxWidth = '100%';
        canvas.style.border = '1px solid #dee2e6';
        canvas.style.borderRadius = '0.25rem';
        canvas.style.marginBottom = '1.5rem';
    }
});