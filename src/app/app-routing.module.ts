import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from './common/types/ERoute';

const routes: Routes = [
	{
		path: '',
		redirectTo: ERoute.PROGRAM,
		pathMatch: 'full',
	},
	{
		path: ERoute.PROGRAM,
		loadComponent: () => import('./modules/program/program.component').then((c) => c.ProgramComponent),
	},
	{
		path: '**',
		redirectTo: ERoute.PROGRAM,
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
