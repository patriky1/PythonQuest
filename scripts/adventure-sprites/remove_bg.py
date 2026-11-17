"""Remove o fundo branco (color-to-alpha só na região externa ligada às bordas)."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def remove_white_bg(path_in, path_out, flood_dist=0.42):
    rgba = np.asarray(Image.open(path_in).convert('RGBA')).astype(np.float64) / 255.0
    rgb, alpha0 = rgba[..., :3], rgba[..., 3]
    # "Distância do branco" por pixel: 0 = branco puro, 1 = canal totalmente escuro.
    dist = (1.0 - rgb).max(axis=-1)
    light = dist < flood_dist
    # Região de fundo = pixels claros conectados à borda da imagem.
    labels, _ = ndimage.label(light)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border[border != 0])
    # Margem de 2 px para pegar o antisserrilhado da borda do objeto.
    bg_soft = ndimage.binary_dilation(bg, iterations=2)
    # Color-to-alpha (branco): alpha = distância do branco; cor "despremultiplicada".
    a = np.clip(dist / flood_dist, 0, 1) ** 1.1
    a = np.where(bg_soft, np.minimum(a, 1.0), 1.0)
    a = np.where(bg, np.clip(dist / flood_dist, 0, 1) ** 1.6, a)
    safe = np.maximum(a, 1e-4)[..., None]
    rgb_out = np.clip((rgb - (1 - safe)) / safe, 0, 1)
    rgb_out = np.where(a[..., None] > 0, rgb_out, 0)
    out = np.dstack([rgb_out, a * alpha0])
    out[out[..., 3] < 0.02] = 0
    Image.fromarray((out * 255).round().astype(np.uint8), 'RGBA').save(path_out, optimize=True)
    print(path_out, 'transparentes:', int((out[..., 3] < 0.05).sum()), '/', a.size)

if __name__ == '__main__':
    remove_white_bg(sys.argv[1], sys.argv[2])
