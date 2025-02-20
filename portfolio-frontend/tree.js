const fs = require('fs');
const path = require('path');

function generateTree(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    const entries = files.map((file, index) => {
        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        const connector = index === files.length - 1 ? '└── ' : '├── ';
        return `${prefix}${connector}${file}${isDirectory ? '/' : ''}\n` +
               (isDirectory ? generateTree(filePath, prefix + (index === files.length - 1 ? '    ' : '│   ')) : '');
    });

    return entries.join('');
}

// Dossier cible (par défaut : dossier où le script est exécuté)
const targetDir = process.argv[2] || '.';

// Vérifier si le dossier existe
if (!fs.existsSync(targetDir)) {
    console.error(`Le dossier "${targetDir}" n'existe pas.`);
    process.exit(1);
}

// Générer l'arborescence et l'afficher
const tree = `${path.basename(targetDir)}/\n${generateTree(targetDir)}`;
console.log(tree);

// Sauvegarder dans un fichier tree.txt
fs.writeFileSync('tree.txt', tree);
console.log('📂 Arborescence enregistrée dans tree.txt');
