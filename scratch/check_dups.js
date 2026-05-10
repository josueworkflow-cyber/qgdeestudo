
const fs = require('fs');

function checkDuplicates() {
    const temas = JSON.parse(fs.readFileSync('./conteudo/temas.json', 'utf-8'));
    const seen = new Map();
    const dups = [];

    temas.forEach(t => {
        const key = `${t.materiaId}_${t.slug}`;
        if (seen.has(key)) {
            dups.push({ key, id1: seen.get(key), id2: t.id });
        }
        seen.set(key, t.id);
    });

    if (dups.length > 0) {
        console.log(`Encontrados ${dups.length} duplicatas de slug:`);
        dups.forEach(d => console.log(`- Chave: ${d.key}, IDs: ${d.id1} e ${d.id2}`));
    } else {
        console.log('Nenhuma duplicata de slug encontrada em temas.');
    }
}

checkDuplicates();
