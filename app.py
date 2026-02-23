import os
import tempfile
import subprocess
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageCms
from PyPDF2 import PdfReader

# Ruta a tu perfil ICC FOGRA39
FOGRA_PATH = '/usr/share/color/icc/ISOcoated_v2_eci.icc'

print("¿El perfil ICC FOGRA39 existe?", os.path.exists(FOGRA_PATH))

app = Flask(__name__)
CORS(app)

def rgb_to_cmyk_with_icc(image_path, fogra39_path=FOGRA_PATH):
    srgb_profile = ImageCms.createProfile("sRGB")
    fogra_profile = ImageCms.ImageCmsProfile(fogra39_path)
    img_rgb = Image.open(image_path).convert('RGB')
    img_cmyk = ImageCms.profileToProfile(img_rgb, srgb_profile, fogra_profile, outputMode='CMYK')
    arr = np.array(img_cmyk)
    C = arr[:,:,0]/255
    M = arr[:,:,1]/255
    Y = arr[:,:,2]/255
    K = arr[:,:,3]/255
    cobertura = {
        "C": round(np.mean(C) * 100, 2),
        "M": round(np.mean(M) * 100, 2),
        "Y": round(np.mean(Y) * 100, 2),
        "K": round(np.mean(K) * 100, 2)
    }
    return cobertura

def pdf_has_fogra39(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        if "/OutputIntents" in reader.trailer["/Root"]:
            intents = reader.trailer["/Root"]["/OutputIntents"]
            for intent in intents:
                if "/DestOutputProfile" in intent:
                    icc_obj = intent["/DestOutputProfile"]
                    icc_bytes = icc_obj.get_data()
                    if b"FOGRA39" in icc_bytes:
                        return True
        return False
    except Exception as e:
        return False

def process_tiffsep(tif_path):
    img = Image.open(tif_path)
    arr = np.array(img)
    coverage = np.sum(arr < 255) / arr.size
    return round(coverage * 100, 2)

@app.route('/calcular-cobertura', methods=['POST'])
def calcular_cobertura():
    if 'imagen' not in request.files or request.files['imagen'].filename == '':
        return jsonify({'error': 'No image uploaded'}), 400

    f = request.files['imagen']
    filename = f.filename.lower()

    with tempfile.TemporaryDirectory() as tempdir:
        file_path = os.path.join(tempdir, filename)
        f.save(file_path)

        # PDF
        if filename.endswith('.pdf'):
            if not pdf_has_fogra39(file_path):
                return jsonify({'error': 'El PDF no tiene perfil FOGRA39 embebido.'}), 400

            gs_command = [
                "gs", "-dBATCH", "-dNOPAUSE", "-dQUIET", "-dSAFER",
                "-sDEVICE=tiffsep", "-sOutputFile=" + os.path.join(tempdir, "sep_%c.tif"),
                "-dFirstPage=1", "-dLastPage=1", file_path
            ]
            try:
                subprocess.run(gs_command, check=True)
            except Exception as e:
                return jsonify({'error': f'Ghostscript error: {e}'}), 500

            results = {}
            for fname in os.listdir(tempdir):
                if fname.startswith("sep_") and fname.endswith(".tif"):
                    channel = fname[4:-4]  # sep_C.tif -> C, sep_M.tif...
                    channel_name = channel.upper()
                    results[channel_name] = process_tiffsep(os.path.join(tempdir, fname))

            return jsonify(results)

        # IMAGEN
        try:
            cobertura = rgb_to_cmyk_with_icc(file_path)
            return jsonify(cobertura)
        except Exception as e:
            return jsonify({'error': f'Image error: {e}'}), 500

if __name__ == '__main__':
    app.run("0.0.0.0", 8080, debug=True)
