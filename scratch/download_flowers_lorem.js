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
        // Handle redirects because loremflickr redirects to the actual image URL
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const newUrl = new URL(res.headers.location, url).href; return downloadImage(newUrl, dest).then(resolve).catch(reject);
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
    let map = {};
    for (let m of matches) {
        const itemId = m[1];
        const title = m[2];
        const flowerName = title.split(' de ')[0].trim();
        const safeName = sanitizeName(flowerName);
        const outPath = path.join(FLOWERS_DIR, safeName + '.jpg');

        if (!map[flowerName]) {
            if (fs.existsSync(outPath)) {
                map[flowerName] = `assets/flowers/${safeName}.jpg`;
                continue;
            }

            console.log(`Descargando: ${flowerName}...`);
            const url = `https://loremflickr.com/600/600/flower,${encodeURIComponent(safeName)}/all`;
            try {
                await downloadImage(url, outPath);
                map[flowerName] = `assets/flowers/${safeName}.jpg`;
                console.log(`-> OK: ${flowerName}`);
            } catch (e) {
                console.error(`-> Error download: ${flowerName}`, e);
            }
            // delay
            await new Promise(r => setTimeout(r, 200));
        }
    }

    // Replace
    for (let m of matches) {
        const itemId = m[1];
        const title = m[2];
        const flowerName = title.split(' de ')[0].trim();
        
        if (map[flowerName]) {
            const regex = new RegExp(`(\\{\\s*id:\\s*${itemId},\\s*title:\\s*'${title}',\\s*price:\\s*\\d+,\\s*img:\\s*')([^']+)'`);
            jsCode = jsCode.replace(regex, `$1${map[flowerName]}'`);
        }
    }

    fs.writeFileSync(JS_PATH, jsCode, 'utf-8');
    console.log("¡Listo!");
})();
