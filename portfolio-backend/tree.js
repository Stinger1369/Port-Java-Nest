const fs = require('fs');
const path = require('path');

function generateTree(dir, prefix = '') {
    // Lire tous les fichiers et dossiers, y compris les cachés si besoin
    let files;
    try {
        files = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error(`Erreur lors de la lecture du dossier ${dir}: ${err.message}`);
        return '';
    }

    // Trier les fichiers pour un affichage cohérent (dossiers d'abord, puis fichiers)
    files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    const entries = files.map((entry, index) => {
        const filePath = path.join(dir, entry.name);
        const isDirectory = entry.isDirectory();
        const connector = index === files.length - 1 ? '└── ' : '├── ';
        const entryLine = `${prefix}${connector}${entry.name}${isDirectory ? '/' : ''}\n`;

        // Si c'est un dossier, explorer récursivement
        if (isDirectory) {
            const newPrefix = prefix + (index === files.length - 1 ? '    ' : '│   ');
            return entryLine + generateTree(filePath, newPrefix);
        }
        return entryLine;
    });

    return entries.join('');
}

// Dossier cible (par défaut : dossier courant)
const targetDir = process.argv[2] || '.';

// Vérifier si le dossier existe
if (!fs.existsSync(targetDir)) {
    console.error(`Le dossier "${targetDir}" n'existe pas.`);
    process.exit(1);
}

// Générer l'arborescence avec le nom du dossier racine
const tree = `${path.basename(targetDir)}/\n${generateTree(targetDir)}`;
console.log(tree);

// Sauvegarder dans un fichier tree.txt
try {
    fs.writeFileSync('tree.txt', tree, 'utf8');
    console.log('📂 Arborescence enregistrée dans tree.txt');
} catch (err) {
    console.error(`Erreur lors de l'écriture dans tree.txt: ${err.message}`);
}