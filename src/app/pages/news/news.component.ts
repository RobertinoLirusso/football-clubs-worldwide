import { Component, OnInit } from '@angular/core';
import { RssService } from '../../services/rss.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  feeds = [
    {
      name: 'BBC Sport',
      url: 'https://feeds.bbci.co.uk/sport/football/rss.xml'
    },
    {
      name: 'ESPN',
      url: 'https://www.espn.com/espn/rss/soccer/news'
    },
    {
      name: 'The Guardian',
      url: 'https://www.theguardian.com/football/rss'
    },
    {
      name: 'Transfermarkt UK',
      url: 'https://www.transfermarkt.co.uk/rss/news'
    },
    {
      name: 'Fox Sports News USA',
      url: 'https://api.foxsports.com/v2/content/optimized-rss?partnerKey=MB0Wehpmuj2lUhuRhQaafhBjAJqaPU244mlTDK1i&size=30&tags=fs/soccer,soccer/epl/league/1,soccer/mls/league/5,soccer/ucl/league/7,soccer/europa/league/8,soccer/wc/league/12,soccer/euro/league/13,soccer/wwc/league/14,soccer/nwsl/league/20,soccer/cwc/league/26,soccer/gold_cup/league/32,soccer/unl/league/67'
    }
    
  ];

  allArticles: any[] = []; // Todas las noticias cargadas
  articles: any[] = []; // Noticias visibles actualmente
  loading = false;
  loadingMore = false;
  
  readonly itemsPerPage = 12;
  currentPage = 1;

  constructor(private rssService: RssService) {}

  ngOnInit() {
    this.loadAllFeeds();
  }

  loadAllFeeds() {
    this.loading = true;
    this.allArticles = [];
    this.articles = [];
    this.currentPage = 1;

    const requests = this.feeds.map(feed =>
      this.rssService.loadFeed(feed.url).pipe(
        map(items =>
          items.map(item => ({
            ...item,
            source: feed.name
          }))
        )
      )
    );

    forkJoin(requests).subscribe(results => {
      this.allArticles = results
        .flat()
        .filter(a => a.title && a.link)
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() -
            new Date(a.pubDate).getTime()
        );

      this.loadMore();
      this.loading = false;
    });
  }

  loadMore() {
    this.loadingMore = true;
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const newArticles = this.allArticles.slice(startIndex, endIndex);
    
    this.articles = [...this.articles, ...newArticles];
    this.currentPage++;
    
    setTimeout(() => {
      this.loadingMore = false;
    }, 300);
  }

  get hasMoreArticles(): boolean {
    return this.articles.length < this.allArticles.length;
  }

  get remainingArticles(): number {
    return this.allArticles.length - this.articles.length;
  }
}