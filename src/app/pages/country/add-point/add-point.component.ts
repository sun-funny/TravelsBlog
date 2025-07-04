import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPoint } from 'src/app/models/point';
import { PointRestService } from 'src/app/services/point-rest/point-rest.service';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-add-point',
  templateUrl: './add-point.component.html',
  styleUrls: ['./add-point.component.scss']
})
export class AddPointComponent implements OnInit {
  countryId: string = '';
  @Output() pointAdded = new EventEmitter<IPoint>();
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  pointForm: FormGroup;
  uploadedFiles: any[] = [];
  submitted = false;
  isLoading = false;
  img = 0;

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
  }

  async onUpload(event: any) {
    this.img = 0;
    this.isLoading = true;
    this.submitted = true;
    
    if (this.pointForm.invalid) {
      this.isLoading = false;
      return;
    }

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
          //this.resetForm();
          //this.ref.close(point); 
          this.isLoading = false;
          this.img = 1;
        },
        error: (err) => {
          console.error('Error adding point:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add point'
          });
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to upload files'
      });
      this.isLoading = false;
    }
  }

  onSubmit() {
    this.submitted = true;
    console.log('img', this.img)
    try {

      if (this.img === 0) {
      const pointData: IPoint = {
        id: this.generateId(),
        name: this.pointForm.value.name,
        description: this.pointForm.value.description,
        img: [],
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
          //this.ref.close(point); 
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error adding point:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add point'
          });
          this.isLoading = false;
        }
      });}
    }catch (error) {
      console.error('Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Не удалось добавить контент'
      });
      this.isLoading = false;
    }
  }

  resetForm() {
    this.pointForm.reset();
    this.uploadedFiles = [];
    this.submitted = false;
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  clearForm() {
    this.resetForm();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}