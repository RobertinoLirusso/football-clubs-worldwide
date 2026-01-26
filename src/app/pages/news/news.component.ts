import { Component, OnInit } from '@angular/core';
import { RssService } from '../../services/rss.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
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
    }
  ];

  articles: any[] = [];
  loading = false;

  constructor(private rssService: RssService) {}

  ngOnInit() {
    this.loadFeed(this.feeds[0]);
  }

  loadFeed(feed: any) {
    this.loading = true;
    this.articles = [];

    this.rssService.loadFeed(feed.url).subscribe(data => {
      this.articles = data.slice(0, 15);
      this.loading = false;
    });
  }
}
