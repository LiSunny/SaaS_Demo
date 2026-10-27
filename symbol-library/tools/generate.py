#!/usr/bin/env python3
"""批量生成图元位图。纯白影棚背景 → 后期抠成透明 PNG。"""
import json, os, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets', 'raw')
WORK = tempfile.mkdtemp(prefix='symgen-')

STYLE = (
    "Flat skeuomorphic 3D app icon of industrial fire-protection equipment. "
    "Straight front orthographic view, the object centered in a square composition, clean simplified geometry, "
    "soft matte stainless steel and light gray metal surfaces with a fire-engine red accent, "
    "soft key light from the upper left, gentle gradient shading, subtle ambient occlusion, "
    "crisp clean edges, no text, no labels, no watermark, no logo, no background panel, no rounded rectangle card, "
    "no frame, no base plate, no square plate or colored backdrop behind the object, "
    "the object floats in empty space, no ground plane, no floor, no table surface, no wall, "
    "no cast shadow on the ground, no reflection, no contact shadow, "
    "the object is the only thing in the picture, "
    "the object is placed on a completely flat seamless pure white studio background "
    "(pure #FFFFFF, absolutely no checkerboard, no grid pattern, no transparency grid, no gradient in the background)"
)

STYLE_NO_RED = (
    "Flat skeuomorphic 3D app icon of industrial fire-protection equipment. "
    "Straight front orthographic view, the object centered in a square composition, clean simplified geometry, "
    "soft matte stainless steel and light gray metal surfaces only, "
    "soft key light from the upper left, gentle gradient shading, subtle ambient occlusion, "
    "crisp clean edges, no text, no labels, no watermark, no logo, no background panel, no rounded rectangle card, "
    "no frame, no base plate, no square plate or colored backdrop behind the object, "
    "the object floats in empty space, no ground plane, no floor, no table surface, no wall, "
    "no cast shadow on the ground, no reflection, no contact shadow, "
    "the object is the only thing in the picture, "
    "the object is placed on a completely flat seamless pure white studio background "
    "(pure #FFFFFF, absolutely no checkerboard, no grid pattern, no transparency grid, no gradient in the background)"
)

SUBJECTS = {
    'TNK-FIRE-01':  'a square concrete fire water reservoir seen exactly from the front, straight-on orthographic view with no perspective and no 3/4 angle, the outer silhouette is a perfect square, four square light gray concrete walls with visible wall thickness, no roof and no cover plate, the top is open and the rim is a straight horizontal line, the front wall is cut away so the inside is visible, the interior is filled with clear blue water up to about two thirds of the depth, flat horizontal water surface, no pipes, no ladder, no people',
    'RES-TANK-01':  'a rectangular flat-top fire water tank seen in front cutaway cross-section, rectangular light gray box walls with visible wall thickness, a flat gray steel cover plate on the top edge, the front wall is removed so the inside is visible, the interior is filled with clear blue water up to about two thirds of the height, flat horizontal water surface, no legs, no pipes, no people',
    'PMP-FIRE-01':  'a horizontal end-suction centrifugal fire pump, a circular fire-engine-red pump casing facing the viewer, gray electric motor body visible behind it, short pipe flanges on the left and the right',
    'PMP-STBY-01':  'a horizontal end-suction centrifugal standby pump, a circular gray-blue pump casing facing the viewer, gray electric motor body visible behind it, short pipe flanges on the left and the right',
    'PMP-STAB-01':  'a compact vertical multistage booster pump with a small pressure vessel mounted directly above it, short pipe flanges on the left and the right',
    'VES-PRE-01':   'a vertical capsule-shaped stainless steel air pressure vessel on three short legs, a small round pressure gauge on top, a fire-engine-red drain valve at the bottom',
    'PMP-SET-01':   'two identical horizontal end-suction centrifugal fire pumps mounted side by side on one shared gray steel base plate, two round pump casings facing the viewer side by side, the left casing fire-engine red and the right casing gray, a gray electric motor body behind each casing, short pipe flanges on the far left and the far right, no red pipes, no manifold, no valves, no instruments',
    'PIP-SEG-01':   {'subject': 'a single straight horizontal section of plain gray metal pipe with a flange on each end, a plain tube, no valve, no handle, no handwheel, no fittings in the middle, nothing else', 'style': STYLE_NO_RED},
    'PIP-ELB-01':   {'subject': 'a single 90 degree L-shaped metal pipe elbow, exactly the shape of the letter L, two straight cylindrical pipe arms joined at a right angle with open circular pipe ends visible, nothing else in the picture, absolutely no pump, no motor, no round casing, no red color', 'style': STYLE_NO_RED},
    'PIP-TEE-01':   'a single T-shaped pipe fitting in medium dark gray metal, one long horizontal pipe with a short vertical branch in the middle, flanged ends on all three openings, the metal body is clearly darker gray than the white background, strong contrast against the background',
    'PIP-RED-01':   'a single concentric gray metal pipe reducer shaped like a truncated cone, wide flange on the left end and narrow flange on the right end',
    'VLV-GATE-01':  'a gate valve with a round light gray metal body, a vertical stem and a fire-engine-red circular handwheel on top, short flanged pipe stubs on both sides',
    'VLV-BUTT-01':  'a butterfly valve with a round light gray metal body, a short lever handle on top, short flanged pipe stubs on both sides',
    'VLV-CHK-01':   'a check valve with a round light gray metal body, a domed cap on top with a small flow arrow embossed on the cap, short flanged pipe stubs on both sides',
    'VLV-RED-01':   'a pressure reducing valve with a round light gray metal body, a spring-loaded adjustment bonnet on top with a small knob, short flanged pipe stubs on both sides',
    'VLV-SIG-01':   'a signal valve with a round light gray metal body, a vertical stem and a small fire-engine-red rectangular signal flag on top, short flanged pipe stubs on both sides',
    'HYD-HOSE-01':  'a fire-engine-red fire hose cabinet standing on the floor, a glass door on the front showing a coiled hose reel, slim gray metal frame',
    'HYD-IND-01':   {'subject': 'an indoor fire hydrant, a fire-engine-red round valve body with a hose nozzle on one side and a short threaded pipe stub below, standing alone with nothing behind it', 'style': STYLE_NO_RED},
    'HYD-OUT-01':   'an above-ground outdoor fire hydrant, a fire-engine-red rounded body with two side hose outlets, a red top cap, standing on a gray flanged base',
    'SNO-WP-01':    {'subject': 'a fire-engine-red fire water monitor, a thick horizontal swivel nozzle barrel on top of a short vertical column, the barrel pointing to the upper right, a round gray base plate at the bottom', 'style': STYLE_NO_RED},
    'CON-IND-01':   'an indoor wall-mounted fire department connection, a squat gray metal body with two horizontal hose couplings on the left and the right and a pipe stub at the bottom, a small fire-engine-red plate',
    'CON-OUT-01':   'an outdoor siamese fire department connection, a vertical gray metal riser with two horizontal hose couplings on opposite sides, a fire-engine-red top cap and a flanged base',
    'PAI-SPG-01':   {'subject': 'a single small round analog pressure gauge dial only, a chrome bezel ring, a white dial face with dark tick marks and a black needle, a short threaded stem at the bottom, nothing else in the picture, no red color', 'style': STYLE_NO_RED},
    'LEV-TX-01':    'a vertical glass sight-tube level gauge with a slim gray metal frame and a red float inside, topped by a round gray transmitter head',
    'CAB-PMP-01':  {'subject': 'a gray fire pump control cabinet standing on the floor, a tall rectangular metal enclosure with a dark display screen on the upper front, three small round indicator lights in a row below it, a door handle on the right side, ventilation louvers at the bottom, a small fire-engine-red label plate on the door', 'style': STYLE_NO_RED},
    'TST-TEST-01': {'subject': 'a fire water end-of-line test device mounted on a short pipe stub, a small light gray metal valve body, a round white pressure gauge on top with a chrome bezel, a capped test hose outlet pointing to the right, a flanged pipe at the bottom', 'style': STYLE_NO_RED},
    'FTM-TX-01':    'an inline water flow meter, a circular gray metal body with a round digital display head on top and flanged pipe stubs on both sides',
}

ORDER = list(SUBJECTS.keys())
REF_NODE = '456733394940201'   # 消防泵参考图，用于统一风格


def asset_url(node_id):
    out = subprocess.run(['mcode-tools', 'get_asset_url', node_id], capture_output=True, text=True, check=True).stdout
    return json.loads(out)['download_url']


def build_args(ids, use_ref):
    reqs = []
    ref = asset_url(REF_NODE) if use_ref else None
    for i in ids:
        entry = SUBJECTS[i]
        subj = entry['subject'] if isinstance(entry, dict) else entry
        style = entry.get('style', STYLE) if isinstance(entry, dict) else STYLE
        item = {
            'prompt': f'{style}. SUBJECT: {subj}',
            'aspect_ratio': '1:1',
            'resolution': '2K',
            'output_file': f'{i}.png',
        }
        if ref:
            item['input_urls'] = [ref]
        reqs.append(item)
    return {'requests': reqs}


def run_batch(ids, use_ref=True):
    args = build_args(ids, use_ref)
    path = os.path.join(WORK, 'batch.json')
    with open(path, 'w') as f:
        json.dump(args, f, ensure_ascii=False)
    out = subprocess.run(['mcode-tools', 'connector', 'call', 'connector__matrix__generate_image',
                          '--args-file', path], capture_output=True, text=True, check=True).stdout
    payload = json.loads(out[out.index('{'):])
    if payload.get('summary'):
        print(payload['summary'])
    for item in payload.get('success_items', []):
        name = item['file_name']
        base = os.path.splitext(name)[0]
        url = asset_url(item['node_id'])
        dest = os.path.join(RAW, base + '.png')
        urllib.request.urlretrieve(url, dest)
        print('  ->', os.path.basename(dest))
    for item in payload.get('failed_items', []):
        print('  FAILED', item)


if __name__ == '__main__':
    ids = sys.argv[1:] if len(sys.argv) > 1 else ORDER
    use_ref = '--ref' in ids
    ids = [i for i in ids if i != '--ref']
    for k in range(0, len(ids), 6):
        chunk = ids[k:k + 6]
        print('batch:', ', '.join(chunk))
        run_batch(chunk, use_ref)
