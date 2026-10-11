import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotfoundComponent } from './pages/notfound/notfound.component';
import { HomeComponent } from './pages/home/home.component';
import { GuessClubComponent } from './pages/guess-club/guess-club.component';
import { NationalTeamsComponent } from './pages/national-teams/national-teams.component';
import { MapComponent } from './pages/map/map.component';
import { ClubSearchComponent } from './pages/club-search/club-search.component';
import { HangmanComponent } from './pages/hangman/hangman.component';
import { PairsComponent } from './pages/pairs/pairs.component';
import { GuessCountryComponent } from './pages/guess-country/guess-country.component';
import { LogoShuffleComponent } from './pages/logo-shuffle/logo-shuffle.component';
import { WorldCupComponent } from './pages/world-cup/world-cup.component';
import { ChampionsLeagueComponent } from './pages/champions-league/champions-league.component';
import { EuropaLeagueComponent } from './pages/europa-league/europa-league.component';

const routes: Routes = [
  {path: '', component: HomeComponent, title: 'Football Clubs Worldwide'},
  {path: 'game', component: GuessClubComponent, title: 'Guess the Football Club'},
  {path: 'map', component: MapComponent, title: 'Interactive Football Club Map'},
  {path: 'national-teams', component: NationalTeamsComponent, title: 'National Football Teams'},
  {path: 'club-search', component: ClubSearchComponent, title: 'Football Club Word Search'},
  {path: 'hangman', component: HangmanComponent, title: 'Football Hangman Game'},
  {path: 'pairs', component: PairsComponent, title: 'Football Logo Memory Game'},
  {path: 'guess-country', component: GuessCountryComponent, title: 'Guess the Football Country'},
  {path: 'logo-shuffle', component: LogoShuffleComponent, title: 'Football Logo Shuffle'},
  {path: 'world-cup', component: WorldCupComponent, title: 'Football World Cup'},
  {path: 'champions-league', component: ChampionsLeagueComponent, title: 'UEFA Champions League Simulator'},
  {path: 'europa-league', component: EuropaLeagueComponent, title: 'UEFA Europa League Simulator'},


  {path: '**', pathMatch: 'full', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
