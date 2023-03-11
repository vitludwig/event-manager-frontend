import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ERoute} from '../../../../common/types/ERoute';

@Component({
	selector: 'app-bottom-menu',
	templateUrl: './bottom-menu.component.html',
	styleUrls: ['./bottom-menu.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatToolbarModule,
		FormsModule,
		RouterModule
	]
})
export class BottomMenuComponent {
	public readonly ERoute = ERoute;
}
