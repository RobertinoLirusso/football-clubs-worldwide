import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { NotfoundComponent } from './pages/notfound/notfound.component';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { CardComponent } from './components/card/card.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { GuessClubComponent } from './pages/guess-club/guess-club.component';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { NationalTeamsComponent } from './pages/national-teams/national-teams.component';
import { MapComponent } from './pages/map/map.component';
import { NewsComponent } from './pages/news/news.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotfoundComponent,
    CardComponent,
    HeaderComponent,
    FooterComponent,
    GuessClubComponent,
    NationalTeamsComponent,
    MapComponent,
    NewsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgxImageZoomModule,
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
