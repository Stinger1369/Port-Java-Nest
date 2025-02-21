import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Permet d'obtenir `__dirname` en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des dossiers et fichiers à exclure
const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', 'coverage', 'out', 'logs'
]);
const EXCLUDED_FILES = new Set([
    'package-lock.json', 'yarn.lock', 'tree.txt', '.DS_Store'
]);

/**
 * Génère l'arborescence du dossier
 */
function generateTree(dir, prefix = '') {
    const files = fs.readdirSync(dir)
        .filter(file => !EXCLUDED_DIRS.has(file) && !EXCLUDED_FILES.has(file)); // Exclure les dossiers et fichiers

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
const targetDir = process.argv[2] ? path.resolve(__dirname, process.argv[2]) : __dirname;

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
