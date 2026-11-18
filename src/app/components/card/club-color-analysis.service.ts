import { Injectable } from '@angular/core';
import { CanvasImageService } from './canvas-image.service';

export interface ClubColorTarget {
  club_name: string;
  club_logo: string;
}

@Injectable({ providedIn: 'root' })
export class ClubColorAnalysisService {
  constructor(private canvasImages: CanvasImageService) {}

  async analyze(
    clubs: ClubColorTarget[],
    isCancelled: () => boolean,
    onColor: (clubName: string, colors: string[]) => void,
    onFailure: (clubName: string) => void,
    onBatchComplete: () => void
  ): Promise<void> {
    const batchSize = 8;

    for (let i = 0; i < clubs.length; i += batchSize) {
      if (isCancelled()) return;

      await Promise.all(
        clubs.slice(i, i + batchSize).map(async club => {
          try {
            const image = await this.canvasImages.loadImageForCanvas(club.club_logo);
            onColor(club.club_name, this.classifyColor(image));
          } catch {
            onFailure(club.club_name);
          }
        })
      );
      onBatchComplete();
    }
  }

  private classifyColor(image: HTMLImageElement): string[] {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, size, size);

    let data: Uint8ClampedArray;
    try {
      data = context.getImageData(0, 0, size, size).data;
    } catch {
      throw new Error('canvas-blocked');
    }

    const counts: Record<string, number> = {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
      skyblue: 0,
      blue: 0,
      purple: 0,
      white: 0,
      black: 0,
    };
    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      total++;
      const { h, s, l } = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
      const bucket = this.bucketColor(h, s, l);
      if (bucket) counts[bucket]++;
    }

    if (!total) return [];

    const minRatio = (name: string) =>
      name === 'black' || name === 'white' ? 0.22 : 0.14;

    return Object.entries(counts)
      .filter(([name, count]) => count / total >= minRatio(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const difference = max - min;

    if (difference !== 0) {
      s = difference / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / difference) % 6;
          break;
        case g:
          h = (b - r) / difference + 2;
          break;
        case b:
          h = (r - g) / difference + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    return { h, s, l };
  }

  private bucketColor(h: number, s: number, l: number): string | null {
    if (l < 0.1) return 'black';
    if (l < 0.18 && s < 0.22) return 'black';
    if (l > 0.92 || (l > 0.85 && s < 0.18)) return 'white';

    if (s < 0.16) {
      if (l < 0.22) return 'black';
      if (l > 0.8) return 'white';
      return null;
    }

    if (h < 12 || h >= 348) return 'red';
    if (h < 40) return 'orange';
    if (h < 68) return 'yellow';
    if (h < 160) return 'green';

    if (h < 205) return l < 0.28 ? 'blue' : 'skyblue';
    if (h < 255) return l > 0.6 ? 'skyblue' : 'blue';
    if (h < 330) return 'purple';
    return 'red';
  }
}
