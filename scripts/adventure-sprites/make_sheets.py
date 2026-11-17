"""Gera as folhas de sprite (atlas) animadas do PythonQuest Adventure.

Cada linha do atlas é uma animação e cada coluna um quadro. Os quadros são
deformações locais da arte original (cabeça, patas, grama, redemoinho), não
transformações da imagem inteira.

uso: python make_sheets.py <pasta_imagens_limpas> <pasta_saida>
"""
import json
import math
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

FRAME = 160  # tamanho de cada quadro no atlas (px)
SRC_DIR, OUT_DIR = sys.argv[1], sys.argv[2]


# ---------------------------------------------------------------- utilidades

def load(name, pad):
    """Carrega a arte em float premultiplicado, com borda transparente `pad`."""
    a = np.asarray(Image.open(f'{SRC_DIR}/{name}.png').convert('RGBA')).astype(np.float64) / 255
    a[..., :3] *= a[..., 3:4]
    return np.pad(a, ((pad, pad), (pad, pad), (0, 0)))


def grid(img):
    h, w = img.shape[:2]
    return np.mgrid[0:h, 0:w].astype(np.float64)


def warp(img, dx, dy):
    """Saída(y, x) = entrada(y - dy, x - dx), bilinear."""
    yy, xx = grid(img)
    coords = [yy - dy, xx - dx]
    return np.stack(
        [ndimage.map_coordinates(img[..., c], coords, order=1, mode='constant', cval=0) for c in range(4)],
        -1,
    )


def tint(img, color, k, mask=None):
    """Mistura a cor (premultiplicada) em direção a `color` com força k."""
    out = img.copy()
    target = np.array(color)[None, None, :] * img[..., 3:4]
    m = k if mask is None else k * mask[..., None]
    out[..., :3] = img[..., :3] * (1 - m) + target * m
    return out


def to_frame(img, fit=0.96):
    """Guarda o quadro (premultiplicado); o enquadramento é feito no atlas."""
    return (np.clip(img, 0, 1), fit)


def save_atlas(name, rows):
    """rows: lista de (nome_da_animação, [quadros]).

    Todos os quadros do personagem são recortados pela MESMA caixa (união do
    conteúdo de todos os quadros) para o sprite não "tremer" entre quadros, e
    o personagem ocupa o quadro inteiro, alinhado pela base.
    """
    all_frames = [f for _, frames in rows for f in frames]
    union = np.zeros(all_frames[0][0].shape[:2], bool)
    for img, _ in all_frames:
        union |= img[..., 3] > 0.02
    ys, xs = np.nonzero(union)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    h, w = y1 - y0, x1 - x0

    cols = max(len(frames) for _, frames in rows)
    atlas = Image.new('RGBA', (cols * FRAME, len(rows) * FRAME), (0, 0, 0, 0))
    meta = {}
    for r, (clip, frames) in enumerate(rows):
        for c, (img, fit) in enumerate(frames):
            scale = FRAME * fit / max(h, w)
            nh, nw = max(1, round(h * scale)), max(1, round(w * scale))
            crop = img[y0:y1, x0:x1]
            pim = Image.fromarray((crop * 255).round().astype(np.uint8), 'RGBa').resize((nw, nh), Image.LANCZOS)
            canvas = Image.new('RGBa', (FRAME, FRAME), (0, 0, 0, 0))
            # Centralizado na horizontal e apoiado na base do quadro.
            canvas.paste(pim, ((FRAME - nw) // 2, FRAME - nh - round(FRAME * (1 - fit) / 2)))
            atlas.paste(canvas.convert('RGBA'), (c * FRAME, r * FRAME))
        meta[clip] = {'row': r, 'count': len(frames)}
    atlas.save(f'{OUT_DIR}/{name}.png', optimize=True)
    return {'columns': cols, 'rows': len(rows), 'clips': meta}


def smoothstep(v):
    v = np.clip(v, 0, 1)
    return v * v * (3 - 2 * v)


# ---------------------------------------------------------------- herói (cobra)

def make_hero():
    pad = 24
    base = load('hero', pad)
    yy, xx = grid(base)
    oy, ox = yy - pad, xx - pad  # coordenadas da arte original

    # Peso da "flexão": a base enrolada fica parada, a cabeça mexe mais.
    bend = smoothstep((165 - oy) / 140) ** 1.4
    head = smoothstep((95 - oy) / 60)

    # Olhos: componentes brancos na região da cabeça.
    rgb = base[..., :3] / np.maximum(base[..., 3:4], 1e-6)
    white = (rgb.min(-1) > 0.82) & (base[..., 3] > 0.9) & (oy > 30) & (oy < 72) & (ox > 60) & (ox < 140)
    labels, n = ndimage.label(white)
    sizes = ndimage.sum(white, labels, range(1, n + 1))
    eye_ids = (np.argsort(sizes)[::-1][:2] + 1).tolist()
    eyes = []
    for eid in eye_ids:
        ys, xs = np.nonzero(labels == eid)
        cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
        ry, rx = (ys.max() - ys.min()) / 2 + 2.5, (xs.max() - xs.min()) / 2 + 2.5
        skin = base[int(ys.min() - ry * 0.35 - 3), int(cx)].copy()  # pele logo acima do olho
        eyes.append((cy, cx, ry, rx, skin))

    def blink(img, closed):
        """Fecha as pálpebras (0 = aberto, 1 = fechado)."""
        if closed <= 0:
            return img
        out = img.copy()
        for cy, cx, ry, rx, skin in eyes:
            inside = ((yy - cy) / ry) ** 2 + ((xx - cx) / rx) ** 2 <= 1
            lid_edge = cy - ry + closed * 2 * ry
            lid = inside & (yy <= lid_edge)
            out[lid] = skin
            # Linha da pálpebra (cílio escuro).
            line = inside & (np.abs(yy - lid_edge) < 1.3)
            if closed >= 0.99:
                arc = cy + ry * 0.15 + ((xx - cx) / rx) ** 2 * ry * 0.25
                line = inside & (np.abs(yy - arc) < 1.4)
            out[line, :3] = np.array([0.12, 0.25, 0.08]) * out[line, 3:4]
        return out

    def frame(dx, dy, closed=0.0, red=0.0):
        img = blink(base, closed)
        img = warp(img, dx, dy)
        if red > 0:
            img = tint(img, (1.0, 0.25, 0.25), red)
        return to_frame(img)

    rows = []

    # idle: respira (sobe/desce o tronco), balança a cabeça e pisca no fim.
    idle = []
    blink_curve = {12: 0.5, 13: 1.0, 14: 0.5}
    for i in range(16):
        t = i / 16
        dx = 2.2 * math.sin(2 * math.pi * t) * bend + 1.2 * math.sin(4 * math.pi * t) * head
        dy = -2.0 * (0.5 - 0.5 * math.cos(2 * math.pi * t)) * bend
        idle.append(frame(dx, dy, blink_curve.get(i, 0)))
    rows.append(('idle', idle))

    # slither: onda que percorre o corpo, cabeça balançando no ritmo.
    slither = []
    for i in range(8):
        t = i / 8
        wave = np.sin(2 * math.pi * (t - oy / 85))
        dx = 5.0 * wave * (0.3 + 0.7 * bend)
        dy = -2.5 * abs(math.sin(2 * math.pi * t)) * bend
        slither.append(frame(dx, dy))
    rows.append(('slither', slither))

    # attack: recolhe a cabeça, dá o bote para frente e volta.
    attack = []
    strike = [0, -0.4, -0.8, 1.0, 0.9, 0.45, 0.15, 0]
    for i, s in enumerate(strike):
        reach = 14 * s if s > 0 else 8 * s
        dx = reach * bend ** 1.6
        dy = (3.0 * s if s > 0 else -2.0 * s) * head
        attack.append(frame(dx, dy, closed=0.5 if s < -0.5 else 0))
    rows.append(('attack', attack))

    # collect: abaixa a cabeça até a moeda, fecha os olhos contente e sobe.
    collect = []
    dip = [0, 0.5, 1.0, 0.9, 0.4, 0]
    for i, d in enumerate(dip):
        collect.append(frame(1.5 * d * bend, 10 * d * head ** 1.2, closed=1.0 if d >= 0.9 else 0))
    rows.append(('collect', collect))

    # hurt: cabeça sacode, olhos fechados e pisca vermelho.
    hurt = []
    shake = [0, -1, 0.8, -0.6, 0.3, 0]
    reds = [0, 0.32, 0.1, 0.22, 0.05, 0]
    for i, (s, r) in enumerate(zip(shake, reds)):
        hurt.append(frame(7 * s * bend, 1.5 * abs(s) * head, closed=1.0 if 0 < i < 4 else 0, red=r))
    rows.append(('hurt', hurt))

    # celebrate: rebola de alegria com olhos fechados ("^^").
    celebrate = []
    for i in range(8):
        t = i / 8
        dx = 5 * math.sin(4 * math.pi * t) * bend
        dy = -3 * abs(math.sin(2 * math.pi * t)) * bend
        celebrate.append(frame(dx, dy, closed=1.0 if 2 <= i <= 5 else 0))
    rows.append(('celebrate', celebrate))

    # confused: inclina a cabeça de um lado para o outro, devagar.
    confused = []
    for i in range(8):
        t = i / 8
        dx = 6 * math.sin(2 * math.pi * t) * head ** 1.3
        dy = 1.5 * abs(math.sin(2 * math.pi * t)) * head
        confused.append(frame(dx, dy, closed=0.35 if i in (2, 6) else 0))
    rows.append(('confused', confused))

    return save_atlas('hero_sheet', rows)


# ---------------------------------------------------------------- bug

def make_bug():
    pad = 10
    base = load('bug', pad)
    yy, xx = grid(base)
    oy, ox = yy - pad, xx - pad
    rgb = base[..., :3] / np.maximum(base[..., 3:4], 1e-6)

    legs = smoothstep((oy - 85) / 28)
    left, right = smoothstep((70 - ox) / 15), smoothstep((ox - 132) / 15)
    center = np.clip(1 - left - right, 0, 1)
    glow = ((rgb[..., 1] > 0.55) & (rgb[..., 1] > rgb[..., 0] + 0.25) & (rgb[..., 1] > rgb[..., 2] + 0.15)).astype(float)
    glow = ndimage.gaussian_filter(glow, 1.0)
    smoke = ((rgb[..., 2] > rgb[..., 1] + 0.12) & (rgb[..., 0] > rgb[..., 1]) & ((ox < 45) | (ox > 150))).astype(float)
    smoke = ndimage.gaussian_filter(smoke, 1.5)

    def frame(t, flash=0.0, red=0.0):
        phase = 2 * math.pi * 2 * t  # duas passadas por ciclo
        dy = legs * (left * 2.6 * np.sin(phase) + right * 2.6 * np.sin(phase + math.pi) + center * 1.5 * np.sin(phase + math.pi / 2))
        dx = legs * (left * 1.8 * np.cos(phase) - right * 1.8 * np.cos(phase + math.pi))
        dy = dy + (1 - legs) * 0.9 * math.sin(phase)  # corpo balança
        dx = dx + smoke * 3.0 * np.sin(2 * math.pi * t + oy * 0.09)
        dy = dy - smoke * 1.5 * (0.5 + 0.5 * np.sin(2 * math.pi * t + ox * 0.07))
        img = warp(base, dx, dy)
        # Olhos verdes pulsam.
        pulse = 0.35 * (0.5 + 0.5 * math.sin(2 * math.pi * t))
        img[..., :3] = np.clip(img[..., :3] + glow[..., None] * pulse * np.array([0.25, 0.6, 0.3]) * img[..., 3:4], 0, 1)
        if flash:
            img = tint(img, (1, 1, 1), flash)
        if red:
            img = tint(img, (1.0, 0.3, 0.3), red)
        return to_frame(img, fit=0.96)

    idle = [frame(i / 12) for i in range(12)]
    hit = [frame(0, flash=0.85), frame(0.1, flash=0.4), frame(0.2, red=0.5), frame(0.3, red=0.15)]
    return save_atlas('bug_sheet', [('idle', idle), ('hit', hit)])


# ---------------------------------------------------------------- moeda

def make_coin():
    pad = 6
    base = load('coin', pad)
    yy, xx = grid(base)
    alpha = base[..., 3] > 0.5
    labels, n = ndimage.label(alpha)
    body_id = np.argmax(ndimage.sum(alpha, labels, range(1, n + 1))) + 1
    body = ndimage.binary_fill_holes(labels == body_id)
    ys, xs = np.nonzero(body)
    cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
    body_soft = ndimage.gaussian_filter(body.astype(float), 0.8)
    rim_color = np.array([0.80, 0.55, 0.08])

    frames = []
    # 8 quadros de giro 3D (frente → borda → verso → borda → frente)
    for i in range(8):
        theta = 2 * math.pi * i / 8
        c = math.cos(theta)
        if abs(c) < 0.12:
            # De lado: só a borda dourada.
            img = np.zeros_like(base)
            half_w = 3.0
            edge = (np.abs(xx - cx) <= half_w) & (np.abs(yy - cy) <= (ys.max() - ys.min()) / 2 * 0.97)
            img[edge, :3] = rim_color
            img[edge, 3] = 1
        else:
            src_x = cx + (xx - cx) / c
            img = np.stack(
                [ndimage.map_coordinates(base[..., ch] * body_soft, [yy, src_x], order=1, cval=0) for ch in range(4)],
                -1,
            )
            img[..., :3] *= 0.72 + 0.28 * abs(c)  # mais escura quando inclinada
        frames.append(to_frame(img, fit=0.9))

    # 8 quadros de frente com um brilho atravessando a moeda
    for i in range(8):
        pos = -0.25 + 1.5 * i / 7
        s = ((xx - xs.min()) + (yy - ys.min()) * 0.55) / ((xs.max() - xs.min()) + (ys.max() - ys.min()) * 0.55)
        band = np.exp(-((s - pos) / 0.07) ** 2) * 0.7 * body_soft
        img = base.copy()
        img[..., :3] = np.clip(img[..., :3] + band[..., None] * (1 - img[..., :3]) * img[..., 3:4], 0, 1)
        frames.append(to_frame(img, fit=0.9))

    return save_atlas('coin_sheet', [('spin', frames)])


# ---------------------------------------------------------------- portal

def make_portal():
    pad = 4
    base = load('goal', pad)
    yy, xx = grid(base)
    oy, ox = yy - pad, xx - pad
    rgb = base[..., :3] / np.maximum(base[..., 3:4], 1e-6)
    cy, cx = 113 + pad, 88 + pad

    blue = (rgb[..., 2] > 0.55) & (rgb[..., 2] > rgb[..., 0] + 0.15) & (ox > 55) & (ox < 122) & (oy > 28) & (oy < 150)
    blue = ndimage.binary_closing(blue, iterations=3)
    blue = ndimage.binary_fill_holes(blue)
    mask = ndimage.gaussian_filter(blue.astype(float), 1.5)
    r = np.hypot(yy - cy, xx - cx)
    R = 58.0
    fall = np.clip(1 - r / R, 0, 1) ** 1.4
    rng = np.random.default_rng(7)
    particles = [(rng.uniform(64, 114), rng.uniform(40, 140), rng.uniform(0.6, 1.0)) for _ in range(9)]

    def rotate(phi):
        ang = phi * fall
        ca, sa = np.cos(ang), np.sin(ang)
        sy = cy + (yy - cy) * ca - (xx - cx) * sa
        sx = cx + (yy - cy) * sa + (xx - cx) * ca
        return np.stack([ndimage.map_coordinates(base[..., ch], [sy, sx], order=1, cval=0) for ch in range(4)], -1)

    def frame(t, energy):
        alpha_speed = 1.4 * energy
        # Redemoinho contínuo: mistura duas rotações para o loop não ter emenda.
        swirl = (1 - t) * rotate(alpha_speed * t) + t * rotate(alpha_speed * (t - 1))
        img = base * (1 - mask[..., None]) + swirl * mask[..., None]
        # Núcleo de luz pulsando.
        core = np.exp(-(r / (14 + 4 * energy)) ** 2) * (0.25 + 0.2 * math.sin(2 * math.pi * t)) * energy
        img[..., :3] = np.clip(img[..., :3] + core[..., None] * np.array([0.7, 0.95, 1.0]) * mask[..., None], 0, 1)
        # Faíscas subindo dentro do portal.
        for px, py, sp in particles:
            y = 150 - ((150 - py) + 110 * sp * t) % 110 + pad
            x = px + pad + 2 * math.sin(2 * math.pi * (t + py / 50))
            dot = np.exp(-(((yy - y) ** 2 + (xx - x) ** 2) / 2.2)) * 0.9 * min(energy, 1.3) * mask
            img[..., :3] = np.clip(img[..., :3] + dot[..., None] * (1 - img[..., :3]), 0, 1)
        if energy > 1:
            boost = 0.18 * (energy - 1) * (0.6 + 0.4 * math.sin(2 * math.pi * t))
            img[..., :3] = np.clip(img[..., :3] + boost * mask[..., None] * np.array([0.5, 0.9, 1.0]) * img[..., 3:4], 0, 1)
        return to_frame(img, fit=0.98)

    idle = [frame(i / 12, 1.0) for i in range(12)]
    opened = [frame(i / 12, 2.2) for i in range(12)]
    return save_atlas('portal_sheet', [('idle', idle), ('open', opened)])


# ---------------------------------------------------------------- parede

def make_wall():
    pad = 6
    base = load('wall', pad)
    yy, xx = grid(base)
    oy, ox = yy - pad, xx - pad
    rgb = base[..., :3] / np.maximum(base[..., 3:4], 1e-6)
    green = (rgb[..., 1] > rgb[..., 0] + 0.06) & (rgb[..., 1] > rgb[..., 2] + 0.04) & (base[..., 3] > 0.3)
    grass = green & ((ox < 48) | (ox > 146) | (oy > 108))
    grass = ndimage.gaussian_filter(ndimage.binary_dilation(grass, iterations=1).astype(float), 1.0)
    tip = smoothstep((128 - oy) / 40)

    frames = []
    for i in range(8):
        t = i / 8
        dx = grass * tip * 2.4 * np.sin(2 * math.pi * t + ox * 0.045)
        frames.append(to_frame(warp(base, dx, np.zeros_like(dx)), fit=0.98))
    return save_atlas('wall_sheet', [('idle', frames)])


if __name__ == '__main__':
    manifest = {
        'frameSize': FRAME,
        'hero': make_hero(),
        'bug': make_bug(),
        'coin': make_coin(),
        'portal': make_portal(),
        'wall': make_wall(),
    }
    with open(f'{OUT_DIR}/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)
    print(json.dumps(manifest, indent=1))
