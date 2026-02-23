import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import tempfile
import subprocess

app = Flask(__name__)
CORS(app)
FOGRA_PATH = '/Users/osanchez/Vista-printingConditions/MiAppFlexo/Perfiles/ISOcoated_v2_eci.icc'

print("¿El perfil ICC FOGRA39 ete?", os.path.exists(FOGRA_PATH))

def process_tiffsep(tif_path):
    img = Image.open(tif_path)
    arr = np.array(img)
    # Valor máximo posible (255 blanco), así que cobertura = suma de no-blancos
    coverage = np.sum(arr < 255) / arr.size
    return round(coverage * 100, 2)

@app.route('/calcular-cobertura', methods=['POST'])
def calcular_cobertura():
    if 'imagen' not in request.files or request.files['imagen'].filename == '':
        return jsonify({'error': 'No image uploaded'}), 400

    f = request.files['imagen']
    filename = f.filename.lower()

    # Guardar temp file
    with tempfile.TemporaryDirectory() as tempdir:
        file_path = os.path.join(tempdir, filename)
        f.save(file_path)

        if filename.endswith('.pdf'):
            # Ghostscript - extrae TIFF separaciones de canal
            gs_command = [
                "gs", "-dBATCH", "-dNOPAUSE", "-dQUIET", "-dSAFER",
                "-sDEVICE=tiffsep", "-sOutputFile=" + os.path.join(tempdir, "sep_%c.tif"),
                "-dFirstPage=1", "-dLastPage=1", file_path
            ]
            subprocess.run(gs_command, check=True)

            # Busca TIFFs generados (uno por canal, nombre como sep_C.tif, sep_M.tif, sep_K.tif, sep_Y.tif, sep_...). 
            results = {}
            for fname in os.listdir(tempdir):
                if fname.startswith("sep_") and fname.endswith(".tif"):
                    channel = fname[4:-4]  # sep_C.tif --> C
                    channel_name = channel.upper()
                    # Detecta y traduce nombres de planas si necesario
                    results[channel_name] = process_tiffsep(os.path.join(tempdir, fname))

            return jsonify(results)

        else:
            # Imagen normal, convierte a CMYK con Pillow (no planas)
            img = Image.open(file_path).convert('CMYK')
            data = np.array(img)
            total = data.shape[0] * data.shape[1]
            c = np.sum(data[:,:,0]) / (255*total)
            m = np.sum(data[:,:,1]) / (255*total)
            y = np.sum(data[:,:,2]) / (255*total)
            k = np.sum(data[:,:,3]) / (255*total)
            return jsonify({
                "C": round(c * 100, 2),
                "M": round(m * 100, 2),
                "Y": round(y * 100, 2),
                "K": round(k * 100, 2)
            })

if __name__ == '__main__':
    app.run("0.0.0.0", 8080, debug=True)
