import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        HeaderComponent,
        FooterComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'clubs-app'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('clubs-app');
  });

  it('should render the shared header and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('app-header').length).toBe(1);
    expect(compiled.querySelectorAll('app-footer').length).toBe(1);
  });

  it('should provide share links for the current page URL', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector<HTMLButtonElement>('.site-share__toggle')!;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const xLink = compiled.querySelector<HTMLAnchorElement>('[aria-label="Share on X"]')!;
    const whatsappLink = compiled.querySelector<HTMLAnchorElement>(
      '[aria-label="Share on WhatsApp"]'
    )!;

    expect(xLink.getAttribute('target')).toBeNull();
    expect(whatsappLink.getAttribute('target')).toBeNull();
    expect(new URL(xLink.href).searchParams.get('url')).toBe(window.location.href);
    expect(new URL(whatsappLink.href).searchParams.get('text')).toBe(
      `Discover Football Clubs Worldwide ${window.location.href}`
    );

    xLink.addEventListener('click', event => event.preventDefault(), { once: true });
    xLink.click();
    fixture.detectChanges();

    expect(compiled.contains(xLink)).toBeTrue();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
