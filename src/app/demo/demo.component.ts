import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, BiasReport } from '../api.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo.html',
  styleUrl: './demo.css'
})
export class DemoComponent {
  mode = signal<'text' | 'pdf'>('text');
  inputText = signal<string>('');
  selectedFile = signal<File | null>(null);
  loading = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  error = signal<string | null>(null);
  results = signal<BiasReport | null>(null);

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  setMode(next: 'text' | 'pdf') {
    this.mode.set(next);
    this.error.set(null);
    this.results.set(null);
    this.uploadProgress.set(0);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) { this.selectedFile.set(null); return; }
    if (file.type !== 'application/pdf') {
      this.error.set('Please upload a PDF file.');
      this.selectedFile.set(null);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.error.set('File too large. Max size is 20MB.');
      this.selectedFile.set(null);
      return;
    }
    this.error.set(null);
    this.selectedFile.set(file);
  }

  async runTextAnalysis() {
    const text = this.inputText().trim();
    if (!text) { this.error.set('Please enter text to analyze.'); return; }
    this.loading.set(true);
    this.error.set(null);
    this.results.set(null);
    try {
      const res = await this.api.analyzeText(text).toPromise();
      if (res) this.results.set(res);
    } catch (e) {
      this.error.set('Failed to analyze text.');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  runPdfAnalysis() {
    const file = this.selectedFile();
    if (!file) { this.error.set('Please select a PDF file.'); return; }
    this.loading.set(true);
    this.error.set(null);
    this.results.set(null);
    this.uploadProgress.set(0);

    this.api.analyzePdf(file).subscribe({
      next: (event: HttpEvent<BiasReport>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percent = Math.round(100 * (event.loaded / event.total));
          this.uploadProgress.set(percent);
        } else if (event.type === HttpEventType.Response) {
          this.results.set(event.body ?? null);
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Failed to analyze PDF.');
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  renderMarkdown(md: string): SafeHtml {
    const html = marked.parse(md ?? '');
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  }
}
