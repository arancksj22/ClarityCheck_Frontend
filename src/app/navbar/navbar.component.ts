import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  showToast = signal(false);

  copyEmail() {
    const email = 'arancksj@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 2000);
    }).catch(err => {
      console.error('Failed to copy email:', err);
    });
  }
}
