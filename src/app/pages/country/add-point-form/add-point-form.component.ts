import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { HttpClient } from '@angular/common/http';
import { IPoint } from 'src/app/models/point';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-point-form',
  templateUrl: './add-point-form.component.html',
  styleUrls: ['./add-point-form.component.scss']
})
export class AddPointFormComponent {
  @Input() countryId: string = '';
  @Output() pointAdded = new EventEmitter<IPoint>();
  @Output() cancelled = new EventEmitter<void>();

  pointForm: FormGroup;
  isSubmitting = false;
  uploadedImages: string[] = [];
  
  environment = environment;

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '300px',
    minHeight: '200px',
    maxHeight: '500px',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Введите описание точки...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' }
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
    uploadUrl: `${environment.apiUrl}/points/upload`,
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['insertVideo', 'insertHorizontalRule', 'toggleEditorMode']
    ]
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.pointForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]]
    });
  }

  onImageUpload(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();
      
      // FIX 1: Use 'images' instead of 'image' to match server expectation
      formData.append('images', file);

      this.http.post<{url: string}>(`${environment.apiUrl}/points/upload`, formData)
        .subscribe({
          next: (response: {url: string}) => {
            this.uploadedImages.push(response.url);
            // Safe clearing - check if clear method exists
            if (event.clear && typeof event.clear === 'function') {
              event.clear();
            }
          },
          error: (error: any) => {
            console.error('Error uploading image:', error);
            // Safe clearing - check if clear method exists
            if (event.clear && typeof event.clear === 'function') {
              event.clear();
            }
          }
        });
    }
  }

  // FIX 2: Proper error handler that checks for clear method
  onImageUploadError(event: any): void {
    console.error('Image upload error:', event);
    // Safe clearing - check if clear method exists
    if (event.clear && typeof event.clear === 'function') {
      event.clear();
    } else {
      console.warn('event.clear is not available');
      // Alternative way to clear if using PrimeNG FileUpload
      if (event.originalEvent && event.originalEvent.clear) {
        event.originalEvent.clear();
      }
    }
  }

  // Alternative method for multiple file uploads
  onFileSelect(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      
      // Append all files with the correct field name
      for (let file of files) {
        formData.append('images', file);
      }

      this.http.post<{urls: string[]}>(`${environment.apiUrl}/points/upload`, formData)
        .subscribe({
          next: (response: {urls: string[]}) => {
            this.uploadedImages = [...this.uploadedImages, ...response.urls];
            // Safe clearing
            if (event.clear && typeof event.clear === 'function') {
              event.clear();
            }
          },
          error: (error: any) => {
            console.error('Error uploading images:', error);
            // Safe clearing
            if (event.clear && typeof event.clear === 'function') {
              event.clear();
            }
          }
        });
    }
  }

  onSubmit(): void {
    if (this.pointForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const newPoint: IPoint = {
        id: this.generateId(),
        name: this.pointForm.value.name,
        description: this.pointForm.value.description,
        img: this.uploadedImages,
        id_country: this.countryId
      };

      this.pointAdded.emit(newPoint);
      this.resetForm();
    }
  }

  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  private resetForm(): void {
    this.pointForm.reset();
    this.uploadedImages = [];
    this.isSubmitting = false;
  }

  private generateId(): string {
    return 'point_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}