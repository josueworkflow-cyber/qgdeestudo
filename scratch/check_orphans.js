
const fs = require('fs');
const path = require('path');

function checkOrphans() {
    const temasRaw = fs.readFileSync('./conteudo/temas.json', 'utf-8');
    const topicosRaw = fs.readFileSync('./conteudo/topicos.json', 'utf-8');

    const temas = JSON.parse(temasRaw);
    const topicos = JSON.parse(topicosRaw);

    const temaIds = new Set(temas.map(t => t.id));
    const orphans = topicos.filter(t => !temaIds.has(t.temaId));

    if (orphans.length > 0) {
        console.log(`Encontrados ${orphans.length} tópicos órfãos:`);
        orphans.forEach(o => console.log(`- Topico ID: ${o.id}, Tema ID: ${o.temaId}, Titulo: ${o.titulo}`));
    } else {
        console.log('Nenhum tópico órfão encontrado.');
    }
}

checkOrphans();
