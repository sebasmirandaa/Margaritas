import os
import re
import time
import requests
from io import BytesIO
from PIL import Image

JS_PATH = 'public/margarita.js'
FLOWERS_DIR = 'public/assets/flowers'

if not os.path.exists(FLOWERS_DIR):
    os.makedirs(FLOWERS_DIR)

with open(JS_PATH, 'r', encoding='utf-8') as f:
    js_code = f.read()

catalog_pattern = re.compile(r"\{\s*id:\s*(\d+),\s*title:\s*'([^']+)',\s*price:\s*\d+,\s*img:\s*'([^']+)'(.*?)\}")
matches = catalog_pattern.findall(js_code)
flower_images_map = {}

print(f"Total items: {len(matches)}")

def get_wiki_image(flower_name):
    # Intentar buscar la flor
    url = f"https://es.wikipedia.org/w/api.php?action=query&titles={flower_name}&prop=pageimages&format=json&pithumbsize=600"
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        pages = data.get('query', {}).get('pages', {})
        for page_id, page_info in pages.items():
            if 'thumbnail' in page_info:
                return page_info['thumbnail']['source']
    except Exception as e:
        print(f"Error con Wiki API: {e}")
    return None

def download_and_crop(url, out_path):
    resp = requests.get(url, timeout=10)
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
        return True
    return False

# Bucle principal
for m in matches:
    item_id, title, img_path, rest = m
    flower_name = title.split(' de ')[0].strip()
    
    # Algunos nombres en wiki pueden requerir añadir "(flor)" o "planta"
    search_names = [flower_name, flower_name + " (flor)", flower_name + " (planta)"]
    
    file_name = flower_name.lower().replace(' ', '_').replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u') + '.jpg'
    out_path = os.path.join(FLOWERS_DIR, file_name)
    
    if flower_name not in flower_images_map:
        if os.path.exists(out_path):
            flower_images_map[flower_name] = f'assets/flowers/{file_name}'
            continue
            
        print(f"Buscando: {flower_name}...")
        img_url = None
        for name in search_names:
            img_url = get_wiki_image(name)
            if img_url:
                break
                
        if img_url:
            try:
                if download_and_crop(img_url, out_path):
                    flower_images_map[flower_name] = f'assets/flowers/{file_name}'
                    print(f"-> Descargada: {flower_name}")
                else:
                    print(f"-> Falla al descargar: {flower_name}")
            except Exception as e:
                print(f"-> Error descargando {flower_name}: {e}")
        else:
            print(f"-> No se encontro imagen para: {flower_name}")
            
        time.sleep(0.5)

# Update JS
new_js_code = js_code
for m in matches:
    item_id, title, img_path, rest = m
    flower_name = title.split(' de ')[0].strip()
    if flower_name in flower_images_map:
        new_img = flower_images_map[flower_name]
        item_pattern = re.compile(r"(\{\s*id:\s*" + str(item_id) + r",\s*title:\s*'" + re.escape(title) + r"',\s*price:\s*\d+,\s*img:\s*')([^']+)'")
        new_js_code = item_pattern.sub(r"\g<1>" + new_img + "'", new_js_code)

with open(JS_PATH, 'w', encoding='utf-8') as f:
    f.write(new_js_code)

print("¡Listo!")
