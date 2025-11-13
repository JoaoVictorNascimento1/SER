// Aguarda o carregamento completo do HTML
document.addEventListener('DOMContentLoaded', () => {

    // Pega as referências dos elementos HTML para manipular
    const form = document.getElementById('ser-form');
    const resultArea = document.getElementById('result-area');
    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');

    // Adicionar "ouvinte" para o evento de envio do formulario
    form.addEventListener('submit', async (event) => {
        
        event.preventDefault();

        loadingDiv.classList.remove('hidden'); // Mostra a mensagem "Processando..."
        submitBtn.disabled = true;             // Desabilita o botão para evitar cliques duplos
        resultArea.innerHTML = '';             // Limpa resultados anteriores

        // Cria um objeto FormData que agrupa todos os dados do formulário,
        // incluindo o arquivo CSV, de forma prática.
        const formData = new FormData(form);

        try {
            // Envia os dados para o backend usando a API Fetch.
            const response = await fetch('/api/gerar-ser', {
                method: 'POST',
                body: formData // O corpo da requisição são os dados do formulário
            });

            // Se a resposta do servidor não for OK (ex: erro 400 ou 500),
            // extrai a mensagem de erro do JSON e a lança como um erro.
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            // Se a resposta for OK, converte o corpo da resposta em JSON.
            const zonas = await response.json();

            // Chama a função para exibir o resultado na tela.
            displayResult(zonas);

        } catch (error) {
            // Se qualquer erro ocorrer no bloco 'try', ele será capturado aqui.
            resultArea.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
            console.error('Falha na requisição:', error);
        } finally {
            // O bloco 'finally' sempre executa, tenha a requisição dado certo ou errado.
            // Ideal para reverter o feedback visual.
            loadingDiv.classList.add('hidden'); // Esconde a mensagem "Processando..."
            submitBtn.disabled = false;            // Reabilita o botão
        }
    });

    /**
     * Função auxiliar para CRIAR o canvas, DESENHAR nele e 
     * exibir o resultado (imagem + botão)
     * @param {object} zonas - O objeto de zonas vindo do backend.
     */
    function displayResult(zonas) {
        // Limpa a área e cria o canvas
        resultArea.innerHTML = `
            <h2>Resultado do SER</h2>
            <canvas id="ser-canvas" width="800" height="800"></canvas>
            <a id="download-btn" href="#" download="ser-resultado.png">Baixar Imagem</a>
        `;

        // Pega as referências do canvas
        const canvas = document.getElementById('ser-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // ADICIONA A LÓGICA DE DESENHO (copiada de gerador_imagem.js)
        // Fundo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

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

        // Desenha os círculos
        zoneConfig.slice().reverse().forEach(zona => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, zona.radius, 0, 2 * Math.PI);
            ctx.stroke();
        });

        // Escreve as palavras
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
                 const isNearBoundary = wordData.isNearBoundary;

                 const angle = (wordIndex * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
                 const distance = innerRadius + (outerRadius - innerRadius) / 2;
                 const x = centerX + distance * Math.cos(angle);
                 const y = centerY + distance * Math.sin(angle);

                 if (isNearBoundary) {
                     ctx.fillStyle = '#FF0000'; // Vermelho
                 } else {
                     ctx.fillStyle = '#000000'; // Preto
                 }
                 
                 ctx.fillText(word, x, y);
            });
        });

        // Faz o botão de download funcionar
        const downloadBtn = document.getElementById('download-btn');
        const imageUrl = canvas.toDataURL('image/png'); // Gera o link da imagem
        downloadBtn.href = imageUrl;

        // Ajusta o estilo da imagem (o canvas)
        canvas.style.maxWidth = "100%";
        canvas.style.border = "1px solid #dee2e6";
        canvas.style.borderRadius = "0.25rem";
        canvas.style.marginBottom = "1.5rem";
    }
});