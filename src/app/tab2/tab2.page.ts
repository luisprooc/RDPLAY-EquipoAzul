import { Component } from '@angular/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  scanning = true;

  async onRefresh(ev: CustomEvent): Promise<void> {
    this.scanning = true;
    await new Promise((r) => setTimeout(r, 1200));
    this.scanning = false;
    const target = ev.target as HTMLIonRefresherElement;
    target.complete();
  }
}
