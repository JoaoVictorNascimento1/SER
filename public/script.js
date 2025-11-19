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

    function displayResult(zonas) {
        resultArea.innerHTML = `
            <h2>Resultado do SER</h2>
            <canvas id="ser-canvas" width="800" height="800"></canvas>
            <a id="download-btn" href="#" download="ser-resultado.png">Baixar Imagem</a>
        `;

        const canvas = document.getElementById('ser-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        constQl = width / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const zoneConfig = [
            { name: 'Núcleo Central', radius: 100, color: '#FF6347' },
            { name: 'Intermediário 1', radius: 200, color: '#FFD700' },
            { name: 'Intermediário 2', radius: 300, color: '#90EE90' },
            { name: 'Periférico', radius: 380, color: '#87CEEB' }
        ];

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

            const innerRadius = (i === 0) ? 0 : zoneConfig[i - 1].radius;
            const outerRadius = zona.radius;

            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = zona.color;
            ctx.fillText(zona.name, centerX, centerY - outerRadius + 15);

            ctx.font = '12px Arial';
            
            wordsInZone.forEach((wordData, wordIndex) => {
                const word = wordData.word;
                const cor = wordData.cor; 

                const angle = (wordIndex * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
                const distance = innerRadius + (outerRadius - innerRadius) / 2;
                const x = centerX + distance * Math.cos(angle);
                const y = centerY + distance * Math.sin(angle);

                 
                if (cor === 'red') {
                     ctx.fillStyle = '#FF0000'; 
                     ctx.font = 'bold 13px Arial'; 
                } else if (cor === 'blue') {
                     ctx.fillStyle = '#0000FF';
                     ctx.font = 'bold 13px Arial';
                } else {
                     ctx.fillStyle = '#000000'; 
                     ctx.font = '12px Arial';
                }
                 
                ctx.fillText(word, x, y);
            });
        });

        const downloadBtn = document.getElementById('download-btn');
        const imageUrl = canvas.toDataURL('image/png');
        downloadBtn.href = imageUrl;

        canvas.style.maxWidth = "100%";
        canvas.style.border = "1px solid #dee2e6";
        canvas.style.borderRadius = "0.25rem";
        canvas.style.marginBottom = "1.5rem";
    }
});