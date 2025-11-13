import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { processarDados } from './src/processamento_dados.js';
import { gerarImagemSER } from './src/gerador_imagem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// configurar multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// inserir arquivos
app.use(express.static(path.join(__dirname, 'public')));

// rota post
app.post('/api/gerar-ser', upload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhum arquivo CSV foi inserido!" });
        }

        // extrai apenas os pesos
        const { peso1, peso2, peso3 } = req.body;
        const pesos = [parseFloat(peso1), parseFloat(peso2), parseFloat(peso3)];
        
        const conteudoCSV = req.file.buffer.toString('utf-8');

        // chama a funcao de processamento de dados
        const zonas = processarDados(conteudoCSV, pesos);

        if (!zonas) {
            return res.status(400).json({ error: 'Nenhuma palavra válida encontrada no arquivo!' });
        }

        // Chama o módulo de geração de imagem com os dados processados
        const imagemURL = gerarImagemSER(zonas);

        // Envia a imagem para o frontend
        res.json({ imagemURL });

    } catch (error) {
        console.error('Erro no servidor: ', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});