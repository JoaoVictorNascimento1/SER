import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { processarDados } from './src/processamento_dados.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gerar-ser', upload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhum arquivo CSV foi inserido!" });
        }

        // Lê a quantidade de palavras do form e constrói o array decrescente
        const numPalavras = parseInt(req.body.numPalavras, 10) || 3;
        
        if (numPalavras < 2 || numPalavras > 6) {
            return res.status(400).json({ error: "Número de palavras inválido. Escolha entre 2 e 6." });
        }

        // Se n = 4, gera [4, 3, 2, 1]
        const pesos = Array.from({ length: numPalavras }, (_, i) => numPalavras - i);

        const conteudoCSV = req.file.buffer.toString('utf8');
        const resultado = processarDados(conteudoCSV, pesos);

        if (!resultado) {
            return res.status(400).json({ error: 'Nenhuma palavra válida encontrada no arquivo!' });
        }

        res.json(resultado);

    } catch (error) {
        console.error('Erro no servidor: ', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});