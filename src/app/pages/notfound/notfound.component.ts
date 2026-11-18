import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrl: './notfound.component.css'
})
export class NotfoundComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'Page not found',
      description: 'The page you are looking for could not be found.',
      robots: 'noindex, nofollow',
    });
  }
}
