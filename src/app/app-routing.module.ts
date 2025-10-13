import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotfoundComponent } from './pages/notfound/notfound.component';
import { HomeComponent } from './pages/home/home.component';
import { GuessClubComponent } from './pages/guess-club/guess-club.component';
import { NationalTeamsComponent } from './pages/national-teams/national-teams.component';

const routes: Routes = [
  {path: '', component: HomeComponent, title: 'Football Clubs Worldwide'},
  {path: 'game', component: GuessClubComponent, title: 'Football Clubs Worldwide'},
  {path: 'national-teams', component: NationalTeamsComponent, title: 'Football Clubs Worldwide'},
  {path: '**', pathMatch: 'full', component: NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
