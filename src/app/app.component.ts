import { Component, OnInit } from '@angular/core';
import { UserProfileService } from './core/user-profile.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private readonly userProfile: UserProfileService) {}

  ngOnInit(): void {
    void this.userProfile.refreshFromStorage();
  }
}
