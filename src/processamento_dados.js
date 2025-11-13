function processarDados(conteudoCSV, pesos) {
    const linhas = conteudoCSV.trim().split(/\r?\n/);
    const palavrasPopulacao = linhas.slice(1).map(linha => linha.split(',').map(p => p.trim().toLowerCase()));

    const dadosPalavra = {};
    let somaTotal = 0;

    // contagem de frequencia
    palavrasPopulacao.forEach(linha => {
        linha.forEach((palavra, index) => {
            if (!palavra) return;
            if (!dadosPalavra[palavra]) {
                dadosPalavra[palavra] = { frequencia: [0, 0, 0], index: 0, zona: '', isNearBoundary: false }; // <-- MUDANÇA
            }
            dadosPalavra[palavra].frequencia[index]++;
        });
    });

    // Cálculo do índice e da soma total
    for (const palavra in dadosPalavra) {
        const dados = dadosPalavra[palavra];
        dados.index = (dados.frequencia[0] * pesos[0]) + (dados.frequencia[1] * pesos[1]) + (dados.frequencia[2] * pesos[2]);
        somaTotal += dados.index;
    }

    if (somaTotal === 0) {
        return null; 
    }

    // Definição das zonas
    for (const palavra in dadosPalavra) {
        const dados = dadosPalavra[palavra];
        const porcentagem = (dados.index / somaTotal) * 100;

        // Limites das zonas (em %)
        const limiteNucleo = 76;
        const limiteInterm1 = 51;
        const limiteInterm2 = 26;
        const limitePeriferico = 1;
        const margemProximidade = 5; // Margem para ser Vermelha

        if (porcentagem >= limiteNucleo) {
            dados.zona = 'Núcleo Central';
            // Não verifica proximidade, é a zona mais alta
        
        } else if (porcentagem >= limiteInterm1) {
            dados.zona = 'Intermediário 1';
            // Verifica se está a 5% do Núcleo Central
            if (porcentagem >= (limiteNucleo - margemProximidade)) { // <-- MUDANÇA
                dados.isNearBoundary = true;
            }
        
        } else if (porcentagem >= limiteInterm2) {
            dados.zona = 'Intermediário 2';
            // Verifica se está a 5% do Intermediário 1
            if (porcentagem >= (limiteInterm1 - margemProximidade)) { // <-- MUDANÇA
                dados.isNearBoundary = true;
            }

        } else if (porcentagem >= limitePeriferico) {
            dados.zona = 'Periférico';
             // Verifica se está a 5% do Intermediário 2
            if (porcentagem >= (limiteInterm2 - margemProximidade)) { // <-- MUDANÇA
                dados.isNearBoundary = true;
            }
        
        } else {
            dados.zona = 'N/A';
        }
    }

    // Agrupamento das palavras por zona
    const zonas = {
        'Núcleo Central': [],
        'Intermediário 1': [],
        'Intermediário 2': [],
        'Periférico': []
    };
    
    Object.keys(dadosPalavra).forEach(p => {
        const dados = dadosPalavra[p];
        const zona = dados.zona; 
        
        if (zonas[zona]) {
            
            zonas[zona].push({ 
                word: p,
                isNearBoundary: dados.isNearBoundary
            });
        }
    });

    return zonas;
}

export {processarDados};