import json

primavera = ['Rosa', 'Tulipán', 'Peonía', 'Fresia', 'Hortensia', 'Margarita', 'Jazmín', 'Azalea', 'Iris', 'Lirio', 'Petunia', 'Caléndula', 'Girasol', 'Gerbera', 'Narciso']
verano = ['Girasol', 'Rosa', 'Hibisco', 'Hortensia', 'Zinnia', 'Dalia', 'Lavanda', 'Buganvilla', 'Cosmos', 'Lirio', 'Celosia', 'Jazmín', 'Portulaca', 'Geranio', 'Gazania']
otono = ['Crisantemo', 'Rosa', 'Dalia', 'Aster', 'Caléndula', 'Pensamiento', 'Begonia', 'Cosmos', 'Hortensia', 'Salvia', 'Alstroemeria', 'Camelia', 'Clavel', 'Margarita', 'Verbena']
invierno = ['Rosa', 'Camelia', 'Ciclamen', 'Pensamiento', 'Prímula', 'Begonia', 'Caléndula', 'Jazmín de invierno', 'Azalea', 'Narciso', 'Tulipán', 'Violeta', 'Mahonia', 'Helleboro', 'Alhelí']

images = ['assets/gen_1.jpg', 'assets/gen_2.jpg', 'assets/gen_3.jpg', 'assets/gen_4.jpg', 'assets/gen_5.jpg', 'assets/gen_6.jpg', 'assets/f-rojas.png', 'assets/f-amarillas.png', 'assets/f-girasol.png']

products = []
feat_primavera = []
feat_verano = []
feat_otono = []
feat_invierno = []

id = 0
for lst, tag, feat_list in [(primavera, 'Primavera', feat_primavera), (verano, 'Verano', feat_verano), (otono, 'Otoño', feat_otono), (invierno, 'Invierno', feat_invierno)]:
    for flower in lst:
        img = images[id % len(images)]
        products.append(f"    {{ id: {id}, title: '{flower} de {tag}', price: 100000, img: '{img}', tag: '{tag}', desc: 'Hermosa flor de {flower} seleccionada para la temporada de {tag}.' }}")
        if len(feat_list) < 4:
            feat_list.append(id)
        id += 1

out = '  var PRODUCTS = [\n' + ',\n'.join(products) + '\n  ];\n\n'
out += f"primavera.flowers = {json.dumps(primavera[:4], ensure_ascii=False)}; feat = {feat_primavera}\n"
out += f"verano.flowers = {json.dumps(verano[:4], ensure_ascii=False)}; feat = {feat_verano}\n"
out += f"otono.flowers = {json.dumps(otono[:4], ensure_ascii=False)}; feat = {feat_otono}\n"
out += f"invierno.flowers = {json.dumps(invierno[:4], ensure_ascii=False)}; feat = {feat_invierno}\n"

with open('generated_products.txt', 'w', encoding='utf-8') as f:
    f.write(out)
