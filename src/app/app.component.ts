import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'merchant-onboarding';

  ngOnInit(): void {
    // Clear old localStorage auth data (migration to sessionStorage)
    // This ensures users are logged out when switching from localStorage to sessionStorage
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('currentUser');
    // localStorage.removeItem('userRole');
  }
}
