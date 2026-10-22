function processarDados(conteudoCSV, pesos) {
    const linhas = conteudoCSV.trim().split(/\r?\n/);
    const palavrasPopulacao = linhas.slice(1).map(linha => linha.split(',').map(p => p.replace(/["']/g, '').trim().toLowerCase()));

    const dadosPalavra = {};

    palavrasPopulacao.forEach(linha => {
        linha.forEach((palavra, index) => {
            if (!palavra) return;
            if (!dadosPalavra[palavra]) {
                dadosPalavra[palavra] = { frequencia: Array(pesos.length).fill(0) };
            }
            if (index < pesos.length) {
                dadosPalavra[palavra].frequencia[index]++;
            }
        });
    });

    let listaPalavras = [];
    let totalEvocacoes = 0;
    let totalSomaIndices = 0;

    // calcula índices, ocorrências e os totais
    for (const palavra in dadosPalavra) {
        const dados = dadosPalavra[palavra];
        
        const indice = dados.frequencia.reduce((soma, frequenciaAtual, i) => {
            return soma + (frequenciaAtual * (pesos[i] || 0));
        }, 0);
        
        const ocorrencias = dados.frequencia.reduce((soma, frequencia) => soma + frequencia, 0);
        
        totalEvocacoes += ocorrencias;
        totalSomaIndices += indice;

        listaPalavras.push({
            word: palavra,
            index: indice,
            ocorrencias,
            cor: null
        });
    }

    if (listaPalavras.length === 0) return null;

    //  calcula percentual com base na soma total dos indices
    listaPalavras.forEach(item => {
        item.percentual = (item.index / totalSomaIndices) * 100;
    });

    listaPalavras.sort((a, b) => b.index - a.index);

    const total = listaPalavras.length;
    const limiteNucleo = Math.ceil(total * 0.25);      
    const limiteInterm1 = Math.ceil(total * 0.50);     
    const limiteInterm2 = Math.ceil(total * 0.75);     

    const zonas = {
        'Núcleo Central': [],
        'Intermediário 1': [],
        'Intermediário 2': [],
        'Periférico': []
    };

    // Distribui as palavras nas zonas (já ordenadas por índice)
    listaPalavras.forEach((item, posicao) => {
        let zonaDestino = '';

        if (posicao < limiteNucleo) zonaDestino = 'Núcleo Central';
        else if (posicao < limiteInterm1) zonaDestino = 'Intermediário 1';
        else if (posicao < limiteInterm2) zonaDestino = 'Intermediário 2';
        else zonaDestino = 'Periférico';

        item.zona = zonaDestino;
        zonas[zonaDestino].push(item);
    });

    // Aplica a nova lógica posicional de cores (25% topo/base)
    const zonasFormatadas = {};
    for (const nomeZona in zonas) {
        const palavrasDaZona = zonas[nomeZona];
        const n = palavrasDaZona.length;
        
        // Define o limite de 25% (arredondado)
        const limite25 = Math.round(n * 0.25);

        zonasFormatadas[nomeZona] = palavrasDaZona.map((item, indexZona) => {
            // Como a lista já está decrescente:
            // topo do array = maior índice. base do array = menor índice.
            if (nomeZona !== 'Núcleo Central' && indexZona < limite25) {
                item.cor = 'red';
            } else if (nomeZona !== 'Periférico' && indexZona >= (n - limite25) && limite25 > 0) {
                item.cor = 'blue';
            } else {
                item.cor = null; // Sem cor (preto)
            }

            return {
                word: item.word,
                cor: item.cor
            };
        });
    }

    return {
        zonas: zonasFormatadas,
        estatisticas: listaPalavras.map((item, posicao) => ({
            palavra: item.word,
            percentual: item.percentual,
            ocorrencias: item.ocorrencias,
            pontuacao: item.index,
            zona: item.zona,
            posicao: posicao + 1
        })),
        totalEvocacoes,
        totalSomaIndices
    };
}

export {processarDados};