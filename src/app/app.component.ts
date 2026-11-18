import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'clubs-app';
  shareMenuOpen = false;

  @ViewChild('shareContainer', { static: true })
  private shareContainer!: ElementRef<HTMLElement>;

  @ViewChild('shareToggle', { static: true })
  private shareToggle!: ElementRef<HTMLButtonElement>;

  toggleShareMenu(): void {
    this.shareMenuOpen = !this.shareMenuOpen;
  }

  getXShareUrl(): string {
    const params = new URLSearchParams({
      text: 'Discover Football Clubs Worldwide',
      url: this.currentUrl,
    });

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  getWhatsAppShareUrl(): string {
    const text = `Discover Football Clubs Worldwide ${this.currentUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  @HostListener('document:click', ['$event'])
  closeShareMenuOnOutsideClick(event: MouseEvent): void {
    if (
      this.shareMenuOpen &&
      !event.composedPath().includes(this.shareContainer.nativeElement)
    ) {
      this.shareMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeShareMenuOnEscape(): void {
    if (!this.shareMenuOpen) {
      return;
    }

    this.shareMenuOpen = false;
    this.shareToggle.nativeElement.focus();
  }

  private get currentUrl(): string {
    return typeof window === 'undefined'
      ? 'https://football-clubs-worldwide.vercel.app'
      : window.location.href;
  }
}
