import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPoint } from 'src/app/models/point';
import { PointRestService } from 'src/app/services/point-rest/point-rest.service';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-point',
  templateUrl: './add-point.component.html',
  styleUrls: ['./add-point.component.scss']
})
export class AddPointComponent implements OnInit {
  countryId: string = '';
  @Output() pointAdded = new EventEmitter<IPoint>();
  
  pointForm: FormGroup;
  uploadedFiles: any[] = [];
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private pointRestService: PointRestService,
    private messageService: MessageService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private http: HttpClient
  ) {
    this.pointForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      images: [[]]
    });
  }

  ngOnInit(): void {
    this.countryId = this.config.data.countryId;
    console.log('Received countryId:', this.countryId);
  }
 
  async onUpload(event: any) {
    this.submitted = true;
    if (this.pointForm.valid) {
      try {
        const formData = new FormData();
        for (let file of event.files) {
          formData.append('images', file);
        }

        const uploadResponse: any = await this.http.post(`${environment.apiUrl}/points/upload`, formData).toPromise();
        const imageUrls = uploadResponse.urls;

        const pointData: IPoint = {
          id: this.generateId(),
          name: this.pointForm.value.name,
          description: this.pointForm.value.description,
          img: imageUrls,
          id_country: this.countryId
        };

        this.pointRestService.createPoint(pointData).subscribe({
          next: (point) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Point added successfully'
            });
            this.pointAdded.emit(point);
            this.resetForm();
          },
          error: (err) => {
            console.error('Error adding point:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to add point'
            });
          }
        });
      } catch (error) {
        console.error('Error uploading files:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload files'
        });
      }
    }
  }

  onSubmit() {
  this.submitted = true;
  if (this.pointForm.valid) {
    const imageUrls = this.uploadedFiles.map(file => {
      return `assets/uploads/${file.name}`;
    });

    const pointData: IPoint = {
      id: this.generateId(),
      name: this.pointForm.value.name,
      description: this.pointForm.value.description,
      img: imageUrls,
      id_country: this.countryId
    };

    this.pointRestService.createPoint(pointData).subscribe({
      next: (point) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Point added successfully'
        });
        this.pointAdded.emit(point);
        //this.resetForm();
      },
      error: (err) => {
        console.error('Error adding point:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add point'
        });
      }
    });
  }
}

  resetForm() {
    this.pointForm.reset();
    this.uploadedFiles = [];
    this.submitted = false;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}