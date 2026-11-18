import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClubWallpaperService } from './club-wallpaper.service';

@Component({
  selector: 'app-club-wallpaper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './club-wallpaper.component.html',
  styleUrls: ['./club-wallpaper.component.css'],
})
export class ClubWallpaperComponent {
  @Input() isOpen = false;
  @Input() club: any = null;
  @Output() closed = new EventEmitter<void>();

  wallpaperStyles: { value: string; label: string; icon: string; description: string }[] = [
    { value: 'aurora', label: 'Aurora', icon: '🌌', description: 'Flowing northern-light ribbons in the crest colors.' },
    { value: 'neon', label: 'Neon Horizon', icon: '🌅', description: 'Retro-futuristic sun over a glowing perspective grid.' },
    { value: 'glass', label: 'Glass', icon: '🔮', description: 'Frosted glass panes floating over luminous orbs.' },
    { value: 'silk', label: 'Silk Waves', icon: '🧵', description: 'Layered satin waves with soft specular edges.' },
    { value: 'flow', label: 'Flow Field', icon: '🌀', description: 'Generative light trails drawn by a flow field.' },
    { value: 'nightmatch', label: 'Night Match', icon: '🏟️', description: 'Floodlight beams, haze and stadium bokeh.' },
    { value: 'editorial', label: 'Editorial', icon: '🔤', description: 'Oversized outline typography, magazine style.' },
    { value: 'prism', label: 'Prism', icon: '💎', description: 'Faceted low-poly glass in a smooth gradient.' },
    { value: 'obsidian', label: 'Obsidian', icon: '🖤', description: 'Polished black marble with glowing veins in the crest color.' },
  ];

  selectedWallpaperStyle = 'aurora';
  selectedWallpaperFormat: 'mobile' | 'desktop' = 'mobile';
  isGeneratingWallpaper = false;

  get selectedWallpaperInfo() {
    return this.wallpaperStyles.find(style => style.value === this.selectedWallpaperStyle);
  }

  constructor(private wallpaperService: ClubWallpaperService) {}

  async downloadClubWallpaper(club: any): Promise<void> {
    if (!club || this.isGeneratingWallpaper) return;
    this.isGeneratingWallpaper = true;

    try {
      const { dataUrl, filename } = await this.wallpaperService.generateWallpaper(
        club,
        this.selectedWallpaperStyle,
        this.selectedWallpaperFormat
      );
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      this.closed.emit();
    } catch (error) {
      console.error('Error generando el wallpaper:', error);
    } finally {
      this.isGeneratingWallpaper = false;
    }
  }
}
