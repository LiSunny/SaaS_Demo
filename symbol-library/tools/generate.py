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
    'SPK-SPR-01': {'subject': 'a single pendant fire sprinkler head, straight front orthographic view, a chrome metal threaded shank at the top, a short vertical stem, a small round red glass bulb in the middle, and a thin horizontal metal deflector plate at the bottom, this is an industrial fire sprinkler head and not a shower head, no shower rose, no perforated spray plate with many holes, no arm, no wall bracket, no pipe run, no water spray, floating in empty space with no floor and no cast shadow', 'style': STYLE_NO_RED},
    'FTM-TX-01':    'an inline water flow meter, a circular gray metal body with a round digital display head on top and flanged pipe stubs on both sides',
    'CYL-GRP-01':   'a bank of three identical tall light gray steel fire extinguishing agent cylinders standing upright side by side in one row, straight front orthographic view, plain round cylindrical bodies with rounded shoulders and flat valve tops, a fire-engine-red identification band around the middle of each bottle body, on top of the rightmost cylinder a round pressure gauge and a fire-engine-red valve handwheel, a slim vertical rectangular pressure indicator bar mounted on the left side of the group, one short outlet pipe at the bottom right, this is an industrial agent storage cylinder bank, absolutely not a portable fire extinguisher, no extinguisher handle, no hose, no horn, no carrying grip, not an oxygen bottle, no tall medical oxygen cylinder, no gas cylinder dust cap, floating in empty space with no floor and no cast shadow',
    'CYL-DRV-01':   'a single small slim nitrogen driver gas cylinder standing upright, straight front orthographic view, a narrow round light gray steel body clearly smaller and slimmer than an agent storage cylinder, a round pressure gauge with a white dial on top, a manual brass valve head with a small handwheel on the very top, a short outlet fitting on the side, no color band on the body, not a large storage cylinder, not a fire extinguisher, floating in empty space with no floor and no cast shadow',
    'MAN-COL-01':   {'subject': 'a horizontal pipe manifold collector, straight front orthographic view, one long horizontal round metal pipe with a flanged connection on the left end, a flanged connection on the right end and a short flanged branch pipe pointing down from the bottom middle, a raised circular flange rim at every opening, flat gray metal body, this is a pipe manifold and not a machine, absolutely no pump, no motor, no round casing, no housing, no pressure vessel, no tank, no red color', 'style': STYLE_NO_RED},
    'VLV-SOL-01':   'a solenoid valve, straight front orthographic view, a round light gray metal valve body with short flanged pipe stubs on the left and the right, a rectangular electrical coil box mounted on top of the body with a squared gray housing, a small fire-engine-red manual bypass lever on the side of the body, a small round pilot valve on the coil box, this is an electrically actuated solenoid valve, no round handwheel, no large handwheel on top, not a fire extinguisher, floating in empty space with no floor and no cast shadow',
    'MAN-PUL-01':   'a local manual fire extinguishing start station, straight front orthographic view, a small wall mounted rectangular gray metal box, a fire-engine-red circular pull ring hanging out of the front face on a short link, a small rectangular label plate below the ring, a conduit fitting at the bottom, this is a manual pull start station, not a round red mushroom push button, floating in empty space with no wall and no floor and no cast shadow',
    'PRS-SIG-01':   {'subject': 'a pressure switch transmitter, straight front orthographic view, a round flat gray metal diaphragm housing with a bolted circular cover in the center, a small rectangular signal junction box with a cable gland attached on the upper right of the round body, a short threaded pipe connection at the bottom, this is a pressure instrument and not a dial gauge, no white dial face, no gauge needle, no scale markings, no red color', 'style': STYLE_NO_RED},
    'RLY-DLY-01':   {'subject': 'a DIN rail mounted time delay relay module, straight front orthographic view, a slim dark gray rectangular plastic module body with a stepped front face, a row of screw terminals along the bottom edge, a small round adjustment knob and a tiny indicator lamp on the front face, a DIN rail clip on the back side, gray and black only, this is an electrical relay module, not a pressure gauge, no round dial face, no red color', 'style': STYLE_NO_RED},
    'PIP-GAS-01':   'a single straight horizontal section of agent extinguishing pipe, straight front orthographic view, a plain round metal tube with a flange on each end, two fire-engine-red identification bands side by side around the middle of the tube so it is clearly different from a plain water pipe, a plain tube, no valve, no handle, no handwheel, no fittings in the middle, floating in empty space with no floor and no cast shadow',
    'NZL-GAS-01':   'a single agent discharge orifice nozzle, straight front orthographic view, a short vertical pipe stub at the bottom flaring upward into a wide cone trumpet bell mouth pointing straight up, a hollow dark opening visible inside the bell, plain gray metal body, this is an industrial orifice nozzle, absolutely not a shower head, no shower head, no perforated sprinkler rose, no round spray plate with many holes, no many small spray nozzles, floating in empty space with no floor and no cast shadow',
    'DET-SMK-01':   'a ceiling mounted round smoke detector seen from directly below, straight bottom view, a flat circular light gray plastic base, a shallow round body, a ring of narrow vent slots around the outer rim, one tiny fire-engine-red indicator lamp dot at the center of the base, no mounting bracket, no ceiling panel, this is a smoke detector, not a pipe, not a valve, floating in empty space with no ceiling and no floor and no cast shadow',
    'DET-HST-01':   'a ceiling mounted differential temperature heat detector seen from directly below, straight bottom view, a flat circular light gray plastic base, a grid of narrow parallel vent slots across the lower half of the base, a small round sensor element in the middle, a tiny fire-engine-red indicator lamp dot, no mounting bracket, no ceiling panel, this is a heat detector, not a pipe, not a valve, floating in empty space with no ceiling and no floor and no cast shadow',
    'ALM-SLR-01':   'a fire alarm sound and light beacon, straight front orthographic view, a two tone housing with a white upper lens dome and a fire-engine-red lower lens dome stacked on a square gray base, a row of narrow horizontal buzzer grille slots on the lower part of the base, a small gray mounting bracket at the bottom, this is a combined sounder and strobe, not a round mushroom push button, floating in empty space with no wall and no floor and no cast shadow',
    'MAN-CLB-01':   'a manual fire alarm call point button, straight front orthographic view, a round fire-engine-red mushroom push button head with a white arrow symbol embossed on the face, a shallow round red collar around the button, a square light gray back plate behind the button, this is a manual call point, no pull ring, no box, floating in empty space with no wall and no floor and no cast shadow',
    'CTL-GAS-01':   'a floor standing gas fire extinguishing control cabinet, straight front orthographic view, a tall rectangular gray metal enclosure with a dark display window on the upper front panel, a row of four small round indicator lamps below the window for normal, alarm, fault and discharge, a horizontal light bar strip lamp across the middle of the door, a slim door handle on the right side, ventilation louvers at the bottom, a small fire-engine-red label plate on the door, no text, floating in empty space with no floor and no cast shadow',
    'MDL-IOR-01':   {'subject': 'a DIN rail mounted fire input output module, straight front orthographic view, a slim dark gray rectangular plastic module with a stepped front face, a long row of screw terminal blocks along the bottom edge, a narrow row of small status lamps along the top edge, a DIN rail clip on the back, gray and black only, no red color, this is an I/O module, not a relay with a knob, not a pressure gauge', 'style': STYLE_NO_RED},
    'VNT-REL-01':   'a wall pressure relief vent panel, straight front orthographic view, a rectangular gray metal louvered blast relief panel with several horizontal pressed slats, a small fire-engine-red rectangular identification plate in the upper left corner, a thin gray frame border around the panel, this is a wall vent cover, not a cabinet, no door handle, no display, floating in empty space with no wall and no floor and no cast shadow',
    'FAN-EXH-01':   'a cabinet centrifugal exhaust fan, straight front orthographic view, a square gray metal housing box with a large circular opening in the middle, curved centrifugal fan impeller blades clearly visible inside the circular opening, a rectangular discharge duct flange on the top of the housing, a small gray terminal box on the lower right side, this is an industrial exhaust fan, not a water pump, no round pump casing, floating in empty space with no floor and no cast shadow',
    'PAI-CYL-01':   {'subject': 'a single small cylinder pressure gauge with a brass adapter, straight front orthographic view, a small round analog gauge dial with a chrome bezel ring and a white dial face with dark tick marks and a black needle, a short brass hex adapter with a threaded stem at the bottom, gray and brass metal only, this is a small instrument gauge for a gas cylinder and not a pipeline gauge, nothing else in the picture, no red color, no red mounting plate, no base plate, no colored backdrop', 'style': STYLE_NO_RED},
    'ALV-GRP-01':   {'subject': 'a wet fire alarm valve group assembly, straight front orthographic view with no perspective and no 3/4 angle, one large light gray cast metal valve body in the center of the picture, a short horizontal pipe flange connection on the left side of the body and another one on the right side, two round analog pressure gauges with white dial faces mounted on short vertical stems on top of the body, one gauge on the left and one gauge on the right, a small rectangular gray metal alarm pressure switch box mounted on a short stem at the top center of the body, a small drain valve with a short horizontal handle at the bottom center of the body, a small fire-engine-red identification plate on the front of the body, matte light gray metal surfaces, no text, no labels, the two gauge dials are plain white and gray with no red color and no red mounting plate behind them, this is a fire water wet alarm valve group, not a fire hydrant, not a water pump, not a gas cylinder, not a fire extinguisher, floating in empty space with no floor and no cast shadow', 'style': STYLE_NO_RED},
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
    os.makedirs(RAW, exist_ok=True)
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
