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

async function fetchWikiImage(name) {
    const url = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=600`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'MargaritasBot/1.0 (contact@example.com)' } });
        const data = await res.json();
        const pages = data.query.pages;
        for (let key in pages) {
            if (pages[key].thumbnail) {
                return pages[key].thumbnail.source;
            }
        }
    } catch (e) {
        console.error(`Error wiki for ${name}:`, e);
    }
    return null;
}

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MargaritasBot/1.0 (contact@example.com)' } }, (res) => {
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

            console.log(`Buscando: ${flowerName}...`);
            let imgUrl = await fetchWikiImage(flowerName) 
                || await fetchWikiImage(flowerName + ' (flor)')
                || await fetchWikiImage(flowerName + ' (planta)');
            
            if (imgUrl) {
                try {
                    await downloadImage(imgUrl, outPath);
                    map[flowerName] = `assets/flowers/${safeName}.jpg`;
                    console.log(`-> OK: ${flowerName}`);
                } catch (e) {
                    console.error(`-> Error download: ${flowerName}`, e);
                }
            } else {
                console.log(`-> Not found: ${flowerName}`);
                // Use a placeholder random seed
                map[flowerName] = `https://picsum.photos/seed/${safeName}/600/600`;
            }
            // delay
            await new Promise(r => setTimeout(r, 300));
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
