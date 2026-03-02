# Gerador de Espiral - TALP

## 1. Introdução

O **Gerador de Espiral - TALP** é uma aplicação web desenvolvida para automatizar a análise de dados e a geração visual de gráficos de Zonas Concêntricas, baseados na **Técnica de Associação Livre de Palavras (TALP)**.

### O que é a TALP e para que servem seus resultados?
A Técnica de Associação Livre de Palavras é um método amplamente utilizado em pesquisas qualitativas (como psicologia, ciências sociais e educação). O pesquisador apresenta um "termo indutor" (ou tema) e pede para os participantes responderem rapidamente com as primeiras palavras que vêm à mente. A importância de cada palavra é medida pela combinação da sua frequência e da ordem em que foi lembrada.

O grande valor dessa técnica está em mapear a **Representação Social** de um grupo sobre um determinado tema. Ao distribuir as palavras geradas no gráfico, o pesquisador consegue interpretar o pensamento coletivo:
* **Núcleo Central:** São as palavras mais fortes, frequentes e lembradas primeiro. Elas representam a essência, as crenças sólidas e o consenso do grupo. É a base mais rígida da representação.
* **Zonas Intermediárias e Periféricas:** Agrupam palavras menos frequentes ou lembradas por último. Refletem as vivências individuais, as práticas do dia a dia ou ideias mais flexíveis que estão sujeitas a mudanças.

### Para que serve este projeto?
Geralmente, tabular esses dados e calcular o peso de cada palavra para descobrir em qual zona ela se encaixa é um processo manual e exaustivo. Este projeto resolve esse problema automatizando totalmente o cálculo matemático e a plotagem gráfica.

Através da interface da aplicação, o usuário pode:
1. Definir os pesos de prioridade para a 1ª, 2ª e 3ª palavras evocadas.
2. Fazer o upload de um arquivo CSV contendo os dados brutos da população pesquisada.
3. Gerar automaticamente um gráfico visual (em formato de alvo/espiral) que divide os termos matematicamente nas zonas de relevância (Núcleo Central, Intermediário 1, Intermediário 2 e Periférico).

A aplicação calcula o índice de cada palavra multiplicando sua frequência nas posições pelos pesos definidos pelo usuário. Além de renderizar o gráfico dinamicamente na tela, a ferramenta permite exportar o resultado final como uma imagem PNG, facilitando a inclusão direta em artigos científicos e relatórios.

## 2. Tecnologias Utilizadas

Este projeto foi construído utilizando uma arquitetura baseada em JavaScript, tanto no cliente (frontend) quanto no servidor (backend), permitindo uma comunicação fluida e uma base de código unificada.

Abaixo, detalhamos os principais conceitos e ferramentas adotadas:

### Backend
* **Node.js e Express:** O Node.js é um ambiente de execução que permite rodar JavaScript no lado do servidor. O Express é um framework minimalista para Node.js, utilizado para construir servidores web e APIs de forma ágil.
  * **Por que foram utilizados:** Foram escolhidos pela velocidade de desenvolvimento e pela facilidade em criar uma API REST simples. O Express gerencia a rota que recebe os dados do formulário (`/api/gerar-ser`) e retorna as zonas processadas em formato JSON.
* **Multer:**
  * **Conceito:** É um middleware (intermediário) para Express e Node.js focado em lidar com dados `multipart/form-data`, que é o formato utilizado quando enviamos arquivos através de formulários HTML.
  * **Por que foi utilizado:** Como o núcleo do projeto é a leitura de um arquivo CSV, o Multer captura esse upload. Optamos por configurá-lo com `memoryStorage()`, o que significa que o CSV é lido diretamente na memória RAM em vez de ser salvo temporariamente no disco do servidor, tornando o processamento e a devolução da resposta muito mais rápidos.

### Frontend
* **HTML5 Canvas API:**
  * **Conceito:** O `<canvas>` é um elemento HTML que atua como um quadro em branco, permitindo a renderização de gráficos 2D dinamicamente através de scripts (geralmente JavaScript).
  * **Por que foi utilizado:** É a peça-chave visual do projeto. Em vez de usar bibliotecas pesadas de gráficos, utilizamos o Canvas com JavaScript puro (`script.js`) para desenhar matematicamente as zonas concêntricas (círculos) e calcular as coordenadas exatas para posicionar cada palavra de acordo com o seu grupo de relevância (Núcleo Central, Intermediário 1 e 2, Periférico). Também permite a fácil exportação do desenho final para uma imagem estática (PNG).
* **Fetch API (Vanilla JS):**
  * **Conceito:** Uma interface nativa dos navegadores modernos para fazer requisições HTTP assíncronas (Ajax).
  * **Por que foi utilizada:** Permite enviar o arquivo CSV e os pesos para o servidor Node.js em segundo plano. Isso evita que a página precise recarregar ao submeter o formulário, proporcionando uma experiência de usuário (UX) muito mais moderna e ágil.
* **Bootstrap 5:**
  * **Conceito:** Um dos frameworks CSS de código aberto mais populares do mundo, focado no desenvolvimento de interfaces responsivas e prontas para dispositivos móveis.
  * **Por que foi utilizado:** Inserido via CDN, o Bootstrap permitiu criar um layout limpo, um formulário bem estruturado e alertas visuais de carregamento (spinners) de forma rápida, sem a necessidade de escrever dezenas de linhas de CSS customizado.
 
 ## 3. Aprofundando no Código

Nesta seção, vamos dissecar a implementação técnica do sistema, analisando os blocos de código fundamentais que fazem a mágica acontecer. Caso não tenha interesse fique livre para seguir para o próximo tópico.

### 3.1. Backend: Upload e Roteamento (`index.js`)

O servidor foi construído com Node.js e Express. Como o usuário precisa enviar um arquivo `.csv`, utilizamos o middleware **Multer**. A escolha por usar `memoryStorage` é um ponto-chave de otimização: em vez de salvar o arquivo no disco do servidor, o CSV é mantido temporariamente na memória RAM, acelerando o processamento.

```javascript
// Configuração do Multer para armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```

Na rota principal POST /api/gerar-ser, nós recebemos os pesos enviados pelo formulário e lemos o buffer do arquivo em formato latin1 (garantindo que a acentuação do português não quebre) antes de enviar para o módulo de processamento:
```javascript
app.post('/api/gerar-ser', upload.single('csvFile'), (req, res) => {
    // Extração e conversão dos pesos
    const { peso1, peso2, peso3 } = req.body;
    const pesos = [parseFloat(peso1), parseFloat(peso2), parseFloat(peso3)];
    
    // Leitura do arquivo em memória
    const conteudoCSV = req.file.buffer.toString('latin1');
    const zonas = processarDados(conteudoCSV, pesos);
    
    // ...
});
```
### A parte Matemática (processamento_dados.js)

Este arquivo contém a regra de negócio da técnica TALP. A função processarDados começa limpando o CSV (removendo espaços extras e passando tudo para minúsculas) para evitar que "Palavra" e "palavra" sejam contadas como itens diferentes.

Em seguida, o algoritmo varre os dados calculando a frequência de cada termo por posição (1ª, 2ª e 3ª palavra evocada). O índice de relevância final de cada termo é calculado aplicando os pesos fornecidos:

```javascript
// Cálculo do índice baseado na frequência e nos pesos
const indice = (dados.frequencia[0] * pesos[0]) + 
               (dados.frequencia[1] * pesos[1]) + 
               (dados.frequencia[2] * pesos[2]);
```
Após o cálculo, a lista de palavras é ordenada do maior índice para o menor. Para criar as zonas concêntricas, a lista é fatiada em quartis (25%, 50% e 75% do total de itens processados):
```javascript
const total = listaPalavras.length;
const limiteNucleo = Math.ceil(total * 0.25);      
const limiteInterm1 = Math.ceil(total * 0.50);     
const limiteInterm2 = Math.ceil(total * 0.75);
```

**Análise de Fronteira (Highlights):** Um detalhe crucial do código é a identificação de palavras "fronteiriças". Se o índice de uma palavra está dentro de uma margem de 5% (0.95 a 1.05) de proximidade com o limite de outra zona, ela recebe uma marcação de cor (red ou blue), alertando o pesquisador de que aquele termo está em transição:
```javascript
// Exemplo no Núcleo Central: checando se está perto de cair para a zona Intermediária
if (item.index <= primeiroIndiceInterm1 * 1.05) {
    item.cor = 'blue';
}
```
### 3.3. Frontend: Desenho e Trigonometria (script.js)

No frontend, após o disparo do formulário via fetch assíncrono, o JSON com as zonas é recebido e repassado para a função displayResult. Aqui, utilizamos a Canvas API do HTML5 para renderizar o gráfico do zero.

Primeiro, desenhamos as linhas das zonas concêntricas (círculos) utilizando um array de configurações de raio:

```javascript
const zoneConfig = [
    { name: 'Núcleo Central', radius: 100, color: '#FF6347' },
    { name: 'Intermediário 1', radius: 200, color: '#FFD700' },
    // ...
];
```
O maior desafio visual é posicionar as palavras dentro das suas respectivas zonas sem que fiquem todas empilhadas no mesmo eixo. Para isso, aplicamos trigonometria (Math.cos e Math.sin). O código divide os 360º da circunferência (2 * Math.PI) pelo número de palavras presentes na zona, distribuindo os termos de forma radial (orbitando o centro) e calculando a distância exata com base no raio interno e externo de cada região:
```javascript
// Cálculo trigonométrico para espalhar as palavras no raio correto
const angle = (wordIndex * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
const distance = innerRadius + (outerRadius - innerRadius) / 2;
const x = centerX + distance * Math.cos(angle);
const y = centerY + distance * Math.sin(angle);

ctx.fillText(word, x, y);
```
Por fim, após desenhar todo o gráfico, o Canvas é convertido nativamente para uma string Base64 através do método toDataURL. Essa URL de dados é injetada no atributo href do botão de download, permitindo que o usuário baixe a imagem localmente sem precisar fazer uma nova requisição ao servidor:

```javascript
const downloadBtn = document.getElementById('download-btn');
const imageUrl = canvas.toDataURL('image/png');
downloadBtn.href = imageUrl;
```

## 4. Como Usar a Aplicação

A aplicação está hospedada e rodando na nuvem através do **Render**. Você pode acessá-la e utilizá-la diretamente pelo link: 

👉 **[https://ser-zgzk.onrender.com/]**

A utilização da ferramenta é bem simples e ocorre de forma fluida através da interface web:

1. **Tema da Pesquisa:** Digite o termo indutor que foi utilizado na sua coleta de dados (ex: "Vida Universitária").
2. **Defina os Pesos:** Insira os valores de importância para as palavras evocadas. O padrão da ferramenta é:
   * **Peso 1 (Maior Prio.):** 3 (Para a primeira palavra lembrada).
   * **Peso 2 (Médio Prio.):** 2 (Para a segunda palavra).
   * **Peso 3 (Menor Prio.):** 1 (Para a terceira palavra).
3. **Upload do CSV:** Clique em "Escolher arquivo" e selecione o seu `.csv` contendo a população pesquisada. 
   * *Atenção ao formato do arquivo:* O sistema ignora a primeira linha (cabeçalho) e lê as palavras das linhas seguintes separadas por vírgula.
4. **Processamento:** Clique no botão **"Gerar Espiral"**. O sistema exibirá um aviso de "Processando..." enquanto o backend realiza os cálculos de relevância e o fatiamento matemático das zonas.
5. **Resultado e Exportação:** O gráfico será renderizado na tela em formato de alvo. Analise as zonas e as palavras destacadas em vermelho ou azul, que representam os termos fronteiriços. Para salvar seu gráfico, basta clicar em **"Baixar Imagem"** e o navegador fará o download de um arquivo `.png` com o resultado visual completo.
