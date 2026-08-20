const fs = require('fs');
const path = require('path');
const https = require('https');

const JS_PATH = path.join(process.cwd(), 'public', 'margarita.js');
const FLOWERS_DIR = path.join(process.cwd(), 'public', 'assets', 'flowers');

if (!fs.existsSync(FLOWERS_DIR)) {
    fs.mkdirSync(FLOWERS_DIR, { recursive: true });
}

let jsCode = fs.readFileSync(JS_PATH, 'utf-8');
const catalogRegex = /\{\s*id:\s*(\d+),\s*title:\s*'([^']+)',\s*price:\s*\d+,\s*img:\s*'([^']+)'(.*?)\}/g;
let matches = [...jsCode.matchAll(catalogRegex)];
console.log(`Encontrados ${matches.length} items`);

function sanitizeName(name) {
    return name.toLowerCase().replace(/ /g, '_')
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const newUrl = new URL(res.headers.location, url).href;
                return downloadImage(newUrl, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error('Status ' + res.statusCode));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
            file.on('error', reject);
        }).on('error', reject);
    });
}

(async () => {
    let seenOriginalImages = new Set();
    let downloadedFlowers = new Set();
    
    // We will build a replacement array because String.replace with regex global doesn't easily let us replace specific matches
    // Wait, we can just replace them one by one if we capture the exact string.
    
    for (let m of matches) {
        const fullMatch = m[0];
        const itemId = m[1];
        const title = m[2];
        const originalImg = m[3];
        const flowerName = title.split(' de ')[0].trim();
        const safeName = sanitizeName(flowerName);
        
        // If this is the FIRST time we see this original image (e.g. 'assets/gen_1.jpg'), keep it!
        if (!seenOriginalImages.has(originalImg)) {
            seenOriginalImages.add(originalImg);
            console.log(`Mantenida foto original con logo: ${originalImg} para el item ${itemId} (${title})`);
            continue; // Do not replace
        }
        
        // Otherwise, it's a duplicate placeholder! We must assign a unique BOUQUET image.
        // We will make the file name unique by using the item id, to guarantee NO REPETITIONS.
        const outName = `${safeName}_${itemId}.jpg`;
        const outPath = path.join(FLOWERS_DIR, outName);
        const newImgPath = `assets/flowers/${outName}`;

        if (!fs.existsSync(outPath)) {
            console.log(`Descargando ramo para: ${title}...`);
            // Keyword "bouquet" to ensure it's a bouquet, not a single flower
            const url = `https://loremflickr.com/600/600/bouquet,${encodeURIComponent(safeName)}/all`;
            try {
                await downloadImage(url, outPath);
                console.log(`-> OK: ${title}`);
            } catch (e) {
                console.error(`-> Error download: ${title}`, e.message);
                continue;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        
        // Replace ONLY this specific item's image in the code
        // We find the exact substring in the file and replace the image path
        const exactItemRegex = new RegExp(`(\\{\\s*id:\\s*${itemId},\\s*title:\\s*'${title}',\\s*price:\\s*\\d+,\\s*img:\\s*')([^']+)'`);
        jsCode = jsCode.replace(exactItemRegex, `$1${newImgPath}'`);
    }

    fs.writeFileSync(JS_PATH, jsCode, 'utf-8');
    console.log("¡Listo!");
})();
