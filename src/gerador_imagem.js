import { createCanvas } from 'canvas';

export function gerarImagemSER(zonas) {
    const width = 800;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

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
             
             // Extrai os dados do objeto
             const word = wordData.word;
             const isNearBoundary = wordData.isNearBoundary;

             const angle = (wordIndex * 2 * Math.PI / wordsInZone.length) + (i * 0.5);
             const distance = innerRadius + (outerRadius - innerRadius) / 2;
             const x = centerX + distance * Math.cos(angle);
             const y = centerY + distance * Math.sin(angle);

             // Define a cor da palavra
             if (isNearBoundary) {
                 ctx.fillStyle = '#FF0000'; // Vermelho
             } else {
                 ctx.fillStyle = '#000000'; // Preto (padrão)
             }
             
             ctx.fillText(word, x, y);
        });
    });

    return canvas.toDataURL();
}