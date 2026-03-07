#!/usr/bin/env python3
"""Genera data/pantone_map.json a partir de Resources/PANTONE+ Solid Coated.cxf

Salida: data/pantone_map.json con formato { "PANTONE 485 C": {"lab": [L,a,b], "srgb": [r,g,b]} }
"""
import os
import json
from xml.etree import ElementTree as ET

WORKDIR = os.path.dirname(os.path.dirname(__file__))
CXF_PATH = os.path.join(WORKDIR, 'Resources', 'PANTONE+ Solid Coated.cxf')
OUT_DIR = os.path.join(WORKDIR, 'data')
OUT_PATH = os.path.join(OUT_DIR, 'pantone_map.json')

def parse_cxf_spectra():
    ns = {'cc': 'http://colorexchangeformat.com/CxF3-core'}
    tree = ET.parse(CXF_PATH)
    root = tree.getroot()
    result = {}
    for obj in root.findall('.//cc:Object', ns):
        name = obj.get('Name')
        if not name:
            continue
        spec = obj.find('.//cc:ReflectanceSpectrum', ns)
        if spec is None:
            continue
        text = (spec.text or '').strip()
        if not text:
            continue
        startwl = float(spec.get('StartWL') or 380)
        values = [float(x) for x in text.split()]
        # store basic spectral data for conversion later
        result[name] = {'startwl': startwl, 'values': values}
    return result

def convert_spectra_to_srgb(spectra):
    out = {}
    try:
        import numpy as np
        import colour
        from colour import MSDS_CMFS, SDS_ILLUMINANTS, SpectralShape
        cmfs = MSDS_CMFS['CIE 1931 2 Degree Standard Observer']
        illuminant = SDS_ILLUMINANTS['D65']
        shape = SpectralShape(380, 780, 1)
        for name, data in spectra.items():
            startwl = data['startwl']
            values = data['values']
            step = 10
            wavelengths = [startwl + i*step for i in range(len(values))]
            sd = colour.SpectralDistribution(dict(zip(wavelengths, values)), name=name)
            sd = sd.interpolate(shape)
            cmfs_i = cmfs.interpolate(shape)
            illum_i = illuminant.interpolate(shape)
            XYZ = colour.sd_to_XYZ(sd, cmfs=cmfs_i, illuminant=illum_i)
            Lab = colour.XYZ_to_Lab(XYZ / 100)
            RGB = colour.XYZ_to_sRGB(XYZ / 100)
            RGB_clamped = [int(round(max(0, min(1, c)) * 255)) for c in RGB]
            out[name] = {'lab': [float(Lab[0]), float(Lab[1]), float(Lab[2])], 'srgb': RGB_clamped}
    except Exception as e:
        # fallback: approximate by band energy
        import numpy as np
        for name, data in spectra.items():
            startwl = data['startwl']
            values = data['values']
            step = 10
            wavelengths = [startwl + i*step for i in range(len(values))]
            arr = np.array(values)
            r_band = arr[(np.array(wavelengths) >= 580) & (np.array(wavelengths) <= 700)].sum()
            g_band = arr[(np.array(wavelengths) >= 490) & (np.array(wavelengths) < 580)].sum()
            b_band = arr[(np.array(wavelengths) >= 380) & (np.array(wavelengths) < 490)].sum()
            tot = r_band + g_band + b_band
            if tot <= 0:
                srgb = [204, 204, 204]
            else:
                rgb = (r_band/tot, g_band/tot, b_band/tot)
                srgb = [int(round(c*255)) for c in rgb]
            out[name] = {'lab': None, 'srgb': srgb}
    return out

def main():
    if not os.path.exists(CXF_PATH):
        print('CXF not found:', CXF_PATH)
        return 1
    spectra = parse_cxf_spectra()
    mapping = convert_spectra_to_srgb(spectra)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print('Wrote', OUT_PATH, 'entries=', len(mapping))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
