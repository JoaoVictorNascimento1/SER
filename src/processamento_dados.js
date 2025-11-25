function processarDados(conteudoCSV, pesos) {
    const linhas = conteudoCSV.trim().split(/\r?\n/);
    
    const palavrasPopulacao = linhas.slice(1).map(linha => linha.split(',').map(p => p.trim().toLowerCase()));

    const dadosPalavra = {};

    palavrasPopulacao.forEach(linha => {
        linha.forEach((palavra, index) => {
            if (!palavra) return;
            if (!dadosPalavra[palavra]) {
                dadosPalavra[palavra] = { frequencia: [0, 0, 0] };
            }
            dadosPalavra[palavra].frequencia[index]++;
        });
    });

    let listaPalavras = [];
    for (const palavra in dadosPalavra) {
        const dados = dadosPalavra[palavra];
        const indice = (dados.frequencia[0] * pesos[0]) + 
                       (dados.frequencia[1] * pesos[1]) + 
                       (dados.frequencia[2] * pesos[2]);
        
        listaPalavras.push({
            word: palavra,
            index: indice,
            highlight: null
        });
    }

    if (listaPalavras.length === 0) return null;

    listaPalavras.sort((a, b) => b.index - a.index);

    const total = listaPalavras.length;
    const limiteNucleo = Math.ceil(total * 0.25);      
    const limiteInterm1 = Math.ceil(total * 0.50);     
    const limiteInterm2 = Math.ceil(total * 0.75);     
    
    const ultimoIndiceNucleo = listaPalavras[limiteNucleo - 1]?.index || 0;
    const ultimoIndiceInterm1 = listaPalavras[limiteInterm1 - 1]?.index || 0;
    const ultimoIndiceInterm2 = listaPalavras[limiteInterm2 - 1]?.index || 0;

    const primeiroIndiceInterm1 = listaPalavras[limiteNucleo]?.index || 0;
    const primeiroIndiceInterm2 = listaPalavras[limiteInterm1]?.index || 0;
    const primeiroIndicePeriferico = listaPalavras[limiteInterm2]?.index || 0;

    const zonas = {
        'Núcleo Central': [],
        'Intermediário 1': [],
        'Intermediário 2': [],
        'Periférico': []
    };

    listaPalavras.forEach((item, posicao) => {
        let zonaDestino = '';

        if (posicao < limiteNucleo) {
            zonaDestino = 'Núcleo Central';
            if (item.index <= primeiroIndiceInterm1 * 1.05) {
                item.highlight = 'blue';
            }
        
        } else if (posicao < limiteInterm1) {
            zonaDestino = 'Intermediário 1';
            
            if (item.index >= ultimoIndiceNucleo * 0.95) { 
                item.highlight = 'red'; 
            }
            else if (item.index <= primeiroIndiceInterm2 * 1.05) {
                item.highlight = 'blue';
            }

        } else if (posicao < limiteInterm2) {
            zonaDestino = 'Intermediário 2';

            if (item.index >= ultimoIndiceInterm1 * 0.95) { 
                item.highlight = 'red'; 
            }
            else if (item.index <= primeiroIndicePeriferico * 1.05) {
                item.highlight = 'blue';
            }

        } else {
            zonaDestino = 'Periférico';
            if (item.index >= ultimoIndiceInterm2 * 0.95) { 
                item.highlight = 'red'; 
            }
        }

        zonas[zonaDestino].push({
            word: item.word,
            highlight: item.highlight
        });
    });

    return zonas;
}

export {processarDados};