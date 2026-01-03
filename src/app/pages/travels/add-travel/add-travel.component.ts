import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-add-travel',
  templateUrl: './add-travel.component.html',
  styleUrls: ['./add-travel.component.scss'],
  providers: [DialogService]
})
export class AddTravelComponent implements OnInit {
  travelForm: FormGroup;
  submitted = false;
  isEditMode = false;
  currentTravelId: string;
  isLoading = false;

  @ViewChild('flagUpload') flagUpload!: FileUpload;
  @ViewChild('imageUpload') imageUpload!: FileUpload;

  constructor(
    private fb: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    public router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private http: HttpClient
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.currentTravelId = params['id'];
        this.loadTravelData(this.currentTravelId);
      }
    });
  }

  createForm() {
    this.travelForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      short_description: ['', Validators.required],
      description: ['', Validators.required],
      flag: ['', Validators.required],
      img: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]],
      featured: [false],
      top: [''],
      left: ['']
    });
  }

  async onFlagUpload(event: any) {
    if (event.files && event.files.length > 0) {
      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('image', event.files[0]);

        const uploadResponse: any = await this.http.post(`${environment.apiUrl}/travels/upload`, formData).toPromise();
        
        this.travelForm.patchValue({
          flag: uploadResponse.url
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Flag uploaded successfully'
        });
      } catch (error) {
        console.error('Error uploading flag:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload flag'
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onImageUpload(event: any) {
    if (event.files && event.files.length > 0) {
      this.isLoading = true;
      try {
        const formData = new FormData();
        formData.append('image', event.files[0]);

        const uploadResponse: any = await this.http.post(`${environment.apiUrl}/travels/upload`, formData).toPromise();
        
        this.travelForm.patchValue({
          img: uploadResponse.url
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Image uploaded successfully'
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload image'
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  loadTravelData(id: string) {
    console.log('travel', id);
    this.travelService.getTravelById(id).subscribe(travel => {
      if (travel) {
        this.travelForm.patchValue({
          country: travel.country,
          city: travel.city,
          short_description: travel.short_description,
          description: travel.description,
          flag: travel.flag,
          img: travel.img,
          year: travel.year,
          featured: travel.featured,
        });

        setTimeout(() => {
          if (this.flagUpload) {
            this.setUploadedFile(this.flagUpload, travel.flag);
          }
          if (this.imageUpload) {
            this.setUploadedFile(this.imageUpload, travel.img);
          }
        }, 0);
      }
    }, error => {
      console.error('Error loading travel:', error);
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.travelForm.valid) {
      const travelData: ITravel = {
        id: this.isEditMode ? this.currentTravelId : this.generateId(),
        ...this.travelForm.value
      };

      const operation = this.isEditMode 
        ? this.travelService.updateTravel(this.currentTravelId, travelData)
        : this.travelService.createTravel(travelData);

      operation.subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Успешно',
            detail: this.isEditMode ? 'Путешествие обновлено' : 'Путешествие добавлено'
          });
          this.router.navigate(['/travels']);
        },
        error: (err) => {
          console.error('Ошибка:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: this.isEditMode ? 'Не удалось обновить путешествие' : 'Не удалось добавить путешествие'
          });
        }
      });
    }
  }

  onDelete() {
    if (confirm('Вы уверены, что хотите удалить это путешествие?')) {
      this.travelService.deleteTravel(this.currentTravelId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Путешествие удалено'
          });
          this.router.navigate(['/travels']);
        },
        error: (err) => {
          console.error('Ошибка при удалении:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить путешествие'
          });
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  setUploadedFile(fileUpload: FileUpload, fileUrl: string) {
    if (!fileUrl) return;
  
    const fullUrl = `${environment.apiUrl}${fileUrl}`;
    const fileName = fileUrl.split('/').pop() || 'uploaded-file.jpg';
  
    const fakeFile: any = {
      name: fileName,
      objectURL: fullUrl,
      size: 1234,
      type: 'image/jpeg'
    };
  
    fileUpload.files = [fakeFile];
  }

  openContentEditor(): void {
    if (this.currentTravelId) {
      this.router.navigate(['/travels', this.currentTravelId]);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Предупреждение',
        detail: 'Сначала сохраните путешествие, чтобы добавить контент'
      });
    }
  }

}
