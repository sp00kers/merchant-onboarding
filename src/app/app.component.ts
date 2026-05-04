import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'merchant-onboarding';
  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // On page load/refresh, immediately validate session with backend
    if (this.authService.isLoggedIn()) {
      this.authService.validateSession().subscribe();
    }

    // Refresh user permissions on every navigation (throttled inside AuthService)
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.authService.refreshCurrentUser().subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
