import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, BiasReport, S3File } from '../api.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { environment } from '../../environments/environment';

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
  
  // Authentication state
  isAuthenticated = signal<boolean>(false);
  userFiles = signal<S3File[]>([]);

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  setMode(next: 'text' | 'pdf') {
    this.mode.set(next);
    this.error.set(null);
    this.results.set(null);
    this.uploadProgress.set(0);
    
    // Load files when switching to PDF mode
    if (next === 'pdf') {
      this.loadFiles();
    }
  }

  loadFiles() {
    this.api.listFiles().subscribe({
      next: (files) => {
        this.isAuthenticated.set(true);
        this.userFiles.set(files);
      },
      error: (err) => {
        if (err.status === 401) {
          this.isAuthenticated.set(false);
          this.userFiles.set([]);
        }
      }
    });
  }

  login() {
    window.location.href = `${environment.apiBaseUrl}/oauth2/authorization/google`;
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
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('File too large. Max size is 10MB.');
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

  runPdfUpload() {
    const file = this.selectedFile();
    if (!file) { this.error.set('Please select a PDF file.'); return; }
    
    this.loading.set(true);
    this.error.set(null);
    this.uploadProgress.set(0);

    this.api.uploadPdf(file).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percent = Math.round(100 * (event.loaded / event.total));
          this.uploadProgress.set(percent);
        } else if (event.type === HttpEventType.Response) {
          this.loading.set(false);
          this.selectedFile.set(null);
          this.loadFiles(); // Refresh file list
          
          // Reset file input
          const input = document.getElementById('pdfFile') as HTMLInputElement;
          if (input) input.value = '';
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.isAuthenticated.set(false);
          this.error.set('Please login to upload files.');
        } else if (err.status === 413) {
          this.error.set('File must be under 10MB.');
        } else if (err.error?.message) {
          this.error.set(err.error.message);
        } else {
          this.error.set('Failed to upload PDF.');
        }
        console.error(err);
      }
    });
  }

  downloadFile(fileName: string) {
    this.api.downloadFile(fileName);
  }

  deleteFile(fileName: string) {
    if (!confirm(`Delete ${fileName}?`)) return;
    
    this.api.deleteFile(fileName).subscribe({
      next: () => {
        this.loadFiles(); // Refresh file list
      },
      error: (err) => {
        if (err.status === 401) {
          this.isAuthenticated.set(false);
          this.error.set('Please login to delete files.');
        } else {
          this.error.set('Failed to delete file.');
        }
        console.error(err);
      }
    });
  }

  renderMarkdown(md: string): SafeHtml {
    const html = marked.parse(md ?? '');
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  }
}
