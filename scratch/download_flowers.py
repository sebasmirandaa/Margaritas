import re
import os
import time
import requests
from io import BytesIO
from PIL import Image
from duckduckgo_search import DDGS

# Config
JS_PATH = 'public/margarita.js'
FLOWERS_DIR = 'public/assets/flowers'

if not os.path.exists(FLOWERS_DIR):
    os.makedirs(FLOWERS_DIR)

# Leer JS
with open(JS_PATH, 'r', encoding='utf-8') as f:
    js_code = f.read()

# Buscar todos los items en CATALOGO
catalog_pattern = re.compile(r"\{\s*id:\s*(\d+),\s*title:\s*'([^']+)',\s*price:\s*\d+,\s*img:\s*'([^']+)'(.*?)\}")
matches = catalog_pattern.findall(js_code)

flower_images_map = {}
ddgs = DDGS()

print(f"Encontrados {len(matches)} items en CATALOGO.")

# Procesar cada flor única
for m in matches:
    item_id, title, img_path, rest = m
    # Extraer el nombre real de la flor, ej: "Rosa de Invierno" -> "Rosa"
    flower_name = title.split(' de ')[0].strip()
    file_name = flower_name.lower().replace(' ', '_') + '.jpg'
    out_path = os.path.join(FLOWERS_DIR, file_name)
    
    if flower_name not in flower_images_map:
        if os.path.exists(out_path):
            print(f"Ya existe imagen para {flower_name}")
            flower_images_map[flower_name] = f'assets/flowers/{file_name}'
            continue
            
        print(f"Buscando imagen para: {flower_name}...")
        query = f"flor {flower_name} hermosa calidad hq"
        
        try:
            results = ddgs.images(query, max_results=10)
            img_downloaded = False
            
            for res in results:
                if img_downloaded:
                    break
                url = res.get('image')
                if not url:
                    continue
                try:
                    resp = requests.get(url, timeout=5)
                    if resp.status_code == 200:
                        img = Image.open(BytesIO(resp.content))
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Recortar cuadrado (Crop center)
                        width, height = img.size
                        new_size = min(width, height)
                        left = (width - new_size)/2
                        top = (height - new_size)/2
                        right = (width + new_size)/2
                        bottom = (height + new_size)/2
                        
                        img = img.crop((left, top, right, bottom))
                        img = img.resize((600, 600), Image.Resampling.LANCZOS)
                        img.save(out_path, format="JPEG", quality=85)
                        
                        flower_images_map[flower_name] = f'assets/flowers/{file_name}'
                        img_downloaded = True
                        print(f"Descargada OK: {flower_name}")
                except Exception as e:
                    print(f"Error descargando {url}: {e}")
                    
            if not img_downloaded:
                print(f"NO SE PUDO DESCARGAR: {flower_name}")
        except Exception as e:
            print(f"Error buscando {flower_name}: {e}")
            
        time.sleep(1) # delay para no saturar ddg
    else:
        # Ya la buscamos en este loop
        pass

# Reemplazar las rutas en JS
new_js_code = js_code
for m in matches:
    item_id, title, img_path, rest = m
    flower_name = title.split(' de ')[0].strip()
    if flower_name in flower_images_map:
        new_img = flower_images_map[flower_name]
        old_str = f"img: '{img_path}'"
        new_str = f"img: '{new_img}'"
        
        # Reemplazar exactamente en la línea de este item
        # Usaremos regex para reemplazar la ruta de la imagen en este item específico
        item_pattern = re.compile(r"(\{\s*id:\s*" + str(item_id) + r",\s*title:\s*'" + re.escape(title) + r"',\s*price:\s*\d+,\s*img:\s*')([^']+)'")
        new_js_code = item_pattern.sub(r"\g<1>" + new_img + "'", new_js_code)

with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(new_js_code)

print("¡Listo! margarita.js actualizado.")
