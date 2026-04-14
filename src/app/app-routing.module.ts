import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'quiz',
    loadChildren: () => import('./pages/quiz/quiz.module').then( m => m.QuizPageModule)
  },
  {
    path: 'memory',
    loadChildren: () => import('./pages/memory/memory.module').then( m => m.MemoryPageModule)
  },
  {
    path: 'sequence',
    loadChildren: () => import('./pages/sequence/sequence.module').then( m => m.SequencePageModule)
  },
  {
  path: 'ranking',
  loadChildren: () => import('./pages/ranking/ranking.module').then(m => m.RankingPageModule)
  },
  {
    path: 'bt-room/:roomId',
    loadChildren: () => import('./pages/bt-room/bt-room.module').then((m) => m.BtRoomPageModule),
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
