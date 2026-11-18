import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CanvasImageService {
  private buildProxiedUrl(url: string): string {
    const clean = url.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(clean)}&output=png`;
  }

  loadImageForCanvas(url: string): Promise<HTMLImageElement> {
    const tryLoad = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('load-failed'));
        img.src = src;
      });
    };

    const isWikimedia = url.includes('upload.wikimedia.org');
    const firstAttempt = isWikimedia ? url : this.buildProxiedUrl(url);

    return tryLoad(firstAttempt).catch(() => {
      const fallback = isWikimedia ? this.buildProxiedUrl(url) : url;
      return tryLoad(fallback).catch(() => {
        throw new Error('No se pudo cargar el logo (ni directo ni vía proxy)');
      });
    });
  }
}
