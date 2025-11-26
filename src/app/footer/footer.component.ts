import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
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
