// Aguarda o carregamento completo do HTML
document.addEventListener('DOMContentLoaded', () => {

    // Pega as referências dos elementos HTML que vamos manipular
    const form = document.getElementById('ser-form');
    const resultArea = document.getElementById('result-area');
    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');

    // Adiciona um "ouvinte" para o evento de envio do formulário.
    form.addEventListener('submit', async (event) => {
        
        // A linha mais importante: impede que o formulário recarregue a página.
        event.preventDefault();

        // --- Inicia o feedback visual para o usuário ---
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
            const data = await response.json();

            // Chama a função para exibir o resultado na tela.
            // IMPORTANTE: A chave 'imagemURL' deve ser a mesma enviada pelo seu backend.
            displayResult(data.imagemURL);

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
     * Função auxiliar para criar o HTML da imagem e do botão de download
     * e inseri-lo na página.
     * @param {string} imageUrl - A URL de dados da imagem gerada pelo backend.
     */
    function displayResult(imageUrl) {
        resultArea.innerHTML = `
            <h2>Resultado do SER</h2>
            <img src="${imageUrl}" alt="Gráfico SER gerado">
            <a href="${imageUrl}" download="ser-resultado.png">Baixar Imagem</a>
        `;
    }
});