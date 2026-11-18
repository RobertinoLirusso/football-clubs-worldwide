import { Injectable } from '@angular/core';
import { CanvasImageService } from './canvas-image.service';

export type LogoBackgroundResult = 'removed' | 'already' | 'complex';

@Injectable({ providedIn: 'root' })
export class ClubLogoProcessingService {
  constructor(private canvasImages: CanvasImageService) {}

  async createStickerLogo(url: string): Promise<{ blob: Blob; result: LogoBackgroundResult }> {
    const size = 250;
    const sticker = 3;
    const padding = 14;
    const image = await this.canvasImages.loadImageForCanvas(url);
    const naturalWidth = image.naturalWidth || size;
    const naturalHeight = image.naturalHeight || size;
    const inner = size - padding * 2;
    const ratio = Math.min(inner / naturalWidth, inner / naturalHeight);
    const width = Math.max(1, Math.round(naturalWidth * ratio));
    const height = Math.max(1, Math.round(naturalHeight * ratio));

    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = width;
    logoCanvas.height = height;
    const logoContext = logoCanvas.getContext('2d')!;
    logoContext.imageSmoothingEnabled = true;
    logoContext.imageSmoothingQuality = 'high';
    logoContext.drawImage(image, 0, 0, width, height);

    const result = this.removeUniformBackground(logoContext, width, height);
    if (result === 'blocked') throw new Error('canvas-blocked');

    const offsetX = Math.round((size - width) / 2);
    const offsetY = Math.round((size - height) / 2);
    const outline = document.createElement('canvas');
    outline.width = size;
    outline.height = size;
    const outlineContext = outline.getContext('2d')!;
    this.dilateInto(
      outlineContext,
      this.tintSilhouette(logoCanvas, '#aeb6c2'),
      offsetX,
      offsetY,
      sticker + 1
    );
    this.dilateInto(
      outlineContext,
      this.tintSilhouette(logoCanvas, '#ffffff'),
      offsetX,
      offsetY,
      sticker
    );

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;
    context.save();
    context.shadowColor = 'rgba(80, 90, 110, 0.35)';
    context.shadowBlur = 8;
    context.shadowOffsetY = 3;
    context.drawImage(outline, 0, 0);
    context.restore();
    context.drawImage(logoCanvas, offsetX, offsetY);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('empty'))), 'image/png')
    );

    return { blob, result };
  }

  private tintSilhouette(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(source, 0, 0);
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  private dilateInto(
    context: CanvasRenderingContext2D,
    silhouette: HTMLCanvasElement,
    x: number,
    y: number,
    radius: number
  ): void {
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      context.drawImage(
        silhouette,
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius
      );
    }
    context.drawImage(silhouette, x, y);
  }

  private removeUniformBackground(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    tolerance = 28
  ): LogoBackgroundResult | 'blocked' {
    let image: ImageData;
    try {
      image = context.getImageData(0, 0, width, height);
    } catch {
      return 'blocked';
    }
    const data = image.data;
    const corners = [
      0,
      (width - 1) * 4,
      (height - 1) * width * 4,
      ((height - 1) * width + width - 1) * 4,
    ];
    if (corners.some(corner => data[corner + 3] < 250)) return 'already';

    const background = [0, 1, 2].map(channel =>
      Math.round(corners.reduce((sum, corner) => sum + data[corner + channel], 0) / 4)
    );
    const distance = (index: number) =>
      Math.max(
        Math.abs(data[index] - background[0]),
        Math.abs(data[index + 1] - background[1]),
        Math.abs(data[index + 2] - background[2])
      );
    if (!corners.every(corner => distance(corner) <= tolerance)) return 'complex';

    const seen = new Uint8Array(width * height);
    const stack: number[] = [];
    const push = (x: number, y: number) => {
      const pixel = y * width + x;
      if (!seen[pixel] && distance(pixel * 4) <= tolerance) {
        seen[pixel] = 1;
        stack.push(pixel);
      }
    };
    for (let x = 0; x < width; x++) {
      push(x, 0);
      push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      push(0, y);
      push(width - 1, y);
    }
    while (stack.length) {
      const pixel = stack.pop()!;
      const x = pixel % width;
      const y = (pixel - x) / width;
      data[pixel * 4 + 3] = 0;
      if (x > 0) push(x - 1, y);
      if (x < width - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < height - 1) push(x, y + 1);
    }

    const soft = tolerance * 2.2;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = y * width + x;
        if (seen[pixel]) continue;
        const touchesBackground =
          (x > 0 && seen[pixel - 1]) ||
          (x < width - 1 && seen[pixel + 1]) ||
          (y > 0 && seen[pixel - width]) ||
          (y < height - 1 && seen[pixel + width]);
        if (!touchesBackground) continue;
        const difference = distance(pixel * 4);
        if (difference < soft) {
          data[pixel * 4 + 3] = Math.round(
            255 * Math.max(0, (difference - tolerance) / (soft - tolerance))
          );
        }
      }
    }

    context.putImageData(image, 0, 0);
    return 'removed';
  }
}
