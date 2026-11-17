"""Deixa as animações de carregamento e de comemoração mais fluidas.

Problemas corrigidos (medidos nos arquivos originais):
  * Quadro repetido a cada 5 quadros: o desenho foi feito a 24 quadros/s e
    convertido para 30 duplicando quadros, o que dá uma "travadinha" 6x por
    segundo. Aqui os repetidos são removidos e o tempo fica uniforme.
  * Pulo no recomeço do loop: o último quadro não emenda no primeiro. Aqui o
    corte é feito no par de quadros mais parecido e o fim se mistura com o
    começo (crossfade), então o loop não tem emenda visível.
  * (GIF) transparência só liga/desliga: bordas serrilhadas. O WebP de saída
    tem transparência suave nas bordas.

Uso (precisa de pillow, numpy e imageio-ffmpeg):
  python smooth_animations.py <splash.mp4> <snake-celebrate.gif> <pasta_saida>

Saídas:
  loading.webp   animação de carregamento (30 quadros/s, loop sem emenda)
  splash.mp4     o mesmo, em vídeo H.264 sem trilha de áudio
  celebrate.webp mascote comemorando (24 quadros/s, confete some aos poucos)
"""
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter, ImageSequence

VIDEO_IN, GIF_IN, OUT_DIR = sys.argv[1], sys.argv[2], sys.argv[3]
# Opcional: "loading" ou "celebrate" para gerar só uma das animações.
ONLY = sys.argv[4] if len(sys.argv) > 4 else 'all'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


# ---------------------------------------------------------------- utilidades

def mean_diff(a, b):
    return float(np.abs(a - b).mean())


def drop_duplicates(frames, threshold=0.05):
    """Remove quadros idênticos ao anterior (os inseridos na conversão 24 -> 30)."""
    unique = [frames[0]]
    for frame in frames[1:]:
        if mean_diff(frame, unique[-1]) > threshold:
            unique.append(frame)
    return unique


def best_loop_cut(frames, search=14):
    """Escolhe início i e fim j (exclusivo) cujo quadro j mais se parece com i.

    Só procura nas pontas para não cortar a parte principal da animação.
    """
    n = len(frames)
    best = (float('inf'), 0, n)
    for i in range(0, min(search, n // 4)):
        for j in range(max(n - search, n // 2), n + 1):
            target = frames[j] if j < n else frames[-1]
            score = mean_diff(target, frames[i])
            # Prefere sequências longas: penaliza levemente cortar muito.
            score += 0.02 * ((n - j) + i)
            if score < best[0]:
                best = (score, i, j)
    _, i, j = best
    return frames[i:j]


def premultiply(rgba):
    out = rgba.copy()
    out[..., :3] *= out[..., 3:4] / 255.0
    return out


def unpremultiply(rgba):
    out = rgba.copy()
    alpha = np.maximum(out[..., 3:4], 1e-6) / 255.0
    out[..., :3] = np.where(out[..., 3:4] > 0, out[..., :3] / alpha, 0)
    return out


def seamless_loop(frames, overlap):
    """Mistura o fim com o começo para o loop não ter emenda.

    A sequência perde `overlap` quadros: os primeiros viram o destino da
    mistura dos últimos. O último quadro de saída é quase o quadro que vem
    antes do primeiro, então a volta ao início é contínua.
    Funciona em RGBA pré-multiplicado (transparência mistura certo).
    """
    pm = [premultiply(f) for f in frames]
    n = len(pm)
    length = n - overlap
    out = []
    for j in range(length):
        frame = pm[j + overlap]
        if j >= length - overlap:
            t = (j - (length - overlap) + 1) / (overlap + 1)
            # Suaviza o começo e o fim da mistura.
            t = t * t * (3 - 2 * t)
            frame = (1 - t) * frame + t * pm[j + overlap - length]
        out.append(frame)
    return [unpremultiply(f) for f in out]


def resample_cyclic(frames, src_fps, dst_fps):
    """Converte a cadência criando quadros intermediários (mistura dos vizinhos).

    Trata a sequência como um ciclo, então até a volta ao início é suavizada.
    Bom para movimentos pequenos por quadro (como a animação de carregamento).
    """
    n = len(frames)
    count = round(n * dst_fps / src_fps)
    step = n / count
    pm = [premultiply(f) for f in frames]
    out = []
    for k in range(count):
        position = k * step
        base = int(np.floor(position)) % n
        frac = position - np.floor(position)
        nxt = (base + 1) % n
        out.append(unpremultiply((1 - frac) * pm[base] + frac * pm[nxt]))
    return out


def sample_at(frames, position):
    """Quadro numa posição fracionária: mistura os dois vizinhos (já pré-multiplicados)."""
    base = int(np.floor(position))
    frac = position - base
    if frac < 1e-6 or base >= len(frames) - 1:
        return frames[min(base, len(frames) - 1)]
    return (1 - frac) * frames[base] + frac * frames[base + 1]


def pingpong_eased(frames, src_fps, dst_fps, ease=8):
    """Loop de ida e volta, desacelerando perto de cada ponta.

    Não mistura poses distantes (sem "imagem fantasma"): só vizinhas, como na
    troca de cadência. A velocidade cai até ~25% nas pontas, então a virada
    parece uma pausa natural em vez de um tranco.
    """
    pm = [premultiply(f) for f in frames]
    last = len(pm) - 1
    base_step = src_fps / dst_fps  # quadros de origem por quadro de saída

    def speed(position):
        edge = min(position, last - position)
        t = np.clip(edge / ease, 0, 1)
        return 0.25 + 0.75 * t * t * (3 - 2 * t)

    positions = []
    position = 0.0
    for direction in (1, -1):
        while True:
            positions.append(position)
            position += direction * base_step * speed(position)
            if direction == 1 and position >= last:
                position = float(last)
                break
            if direction == -1 and position <= 0:
                break

    return [unpremultiply(sample_at(pm, p)) for p in positions]


def uniform_durations(count, fps):
    """Durações em ms que somam exatamente count/fps segundos (ex.: 33, 33, 34)."""
    total = 1000.0 * count / fps
    edges = [round(total * k / count) for k in range(count + 1)]
    return [edges[k + 1] - edges[k] for k in range(count)]


def to_image(frame):
    return Image.fromarray(np.clip(frame, 0, 255).round().astype(np.uint8), 'RGBA')


def save_webp(frames, fps, path, quality, lossless=False, opaque=False):
    images = [to_image(f) for f in frames]
    if opaque:
        # Fundo sólido: sem canal de transparência o arquivo fica bem menor.
        images = [image.convert('RGB') for image in images]
    images[0].save(
        path,
        save_all=True,
        append_images=images[1:],
        duration=uniform_durations(len(images), fps),
        loop=0,
        quality=quality,
        method=6,
        lossless=lossless,
        # Cada quadro é desenhado inteiro (sem herdar restos do anterior).
        minimize_size=False,
        allow_mixed=False
    )


def smooth_binary_alpha(frame):
    """Suaviza bordas de transparência liga/desliga (GIF) sem engordar o desenho."""
    alpha = Image.fromarray(frame[..., 3].astype(np.uint8), 'L')
    soft = np.asarray(alpha.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float64)
    original = frame[..., 3]
    # Dentro continua opaco; a borda vira um degradê curto.
    new_alpha = np.where(original > 0, np.maximum(soft, 0), soft * 0.85)
    new_alpha = np.where(original > 0, np.clip(soft * 1.6, 0, 255), new_alpha)

    # Pixels que ganharam um pouco de opacidade herdam a cor do vizinho.
    rgb = frame[..., :3]
    weight = Image.fromarray((original > 0).astype(np.uint8) * 255, 'L').filter(
        ImageFilter.GaussianBlur(1.2)
    )
    weight = np.asarray(weight).astype(np.float64)[..., None]
    bled = np.zeros_like(rgb)
    for channel in range(3):
        premult = Image.fromarray((rgb[..., channel] * (original > 0)).astype(np.uint8), 'L')
        blurred = np.asarray(premult.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float64)
        bled[..., channel] = blurred / np.maximum(weight[..., 0], 1e-6) * 255
    rgb = np.where(original[..., None] > 0, rgb, np.clip(bled, 0, 255))

    out = frame.copy()
    out[..., :3] = rgb
    out[..., 3] = new_alpha
    return out


def read_video(path):
    reader = imageio_ffmpeg.read_frames(path, pix_fmt='rgb24')
    meta = next(reader)
    w, h = meta['size']
    frames = []
    for raw in reader:
        rgb = np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float64)
        frames.append(np.dstack([rgb, np.full((h, w), 255.0)]))
    return frames, meta['fps']


def write_mp4(frames, fps, path):
    h, w = frames[0].shape[:2]
    command = [
        FFMPEG, '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
        '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    for frame in frames:
        process.stdin.write(np.clip(frame[..., :3], 0, 255).round().astype(np.uint8).tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise SystemExit('ffmpeg falhou ao gravar o mp4')


def report(name, frames):
    """Movimento entre quadros (pré-multiplicado) e a emenda real do loop (último -> primeiro)."""
    pm = [premultiply(f) for f in frames]
    diffs = [mean_diff(pm[k + 1], pm[k]) for k in range(len(pm) - 1)]
    seam = mean_diff(pm[0], pm[-1])
    zero = sum(1 for d in diffs if d < 0.05)
    print(
        f'{name}: {len(frames)} quadros | movimento médio {np.mean(diffs):.2f} '
        f'máx {max(diffs):.2f} | repetidos {zero} | emenda do loop {seam:.2f}'
    )


# ---------------------------------------------------------------- carregamento

if ONLY in ('all', 'loading'):
    video, video_fps = read_video(VIDEO_IN)
    report('vídeo original', video)
    unique = drop_duplicates(video)
    source_fps = video_fps * len(unique) / len(video)  # cadência real do desenho (~24)
    # Nenhum par de quadros do vídeo emenda sem "fantasma" numa mistura, então o
    # loop vai e volta, desacelerando nas pontas.
    loading = pingpong_eased(unique, source_fps, 30)
    report('carregamento novo', loading)
    save_webp(loading, 30, f'{OUT_DIR}/loading.webp', quality=74, opaque=True)
    write_mp4(loading, 30, f'{OUT_DIR}/splash.mp4')

# ---------------------------------------------------------------- comemoração

if ONLY in ('all', 'celebrate'):
    gif = Image.open(GIF_IN)
    gif_frames = [
        np.asarray(f.convert('RGBA')).astype(np.float64) for f in ImageSequence.Iterator(gif)
    ]
    report('GIF original', gif_frames)
    gif_unique = drop_duplicates(gif_frames)
    gif_smooth = [smooth_binary_alpha(f) for f in gif_unique]
    # Movimento grande por quadro: mantém 24 quadros/s (sem misturar quadros),
    # só o loop ganha a mistura longa para o confete sumir aos poucos. As poses
    # do começo e do fim são quase iguais, então a mistura não cria fantasma.
    celebrate = seamless_loop(gif_smooth, overlap=14)
    report('comemoração nova', celebrate)
    save_webp(celebrate, 24, f'{OUT_DIR}/celebrate.webp', quality=88)
