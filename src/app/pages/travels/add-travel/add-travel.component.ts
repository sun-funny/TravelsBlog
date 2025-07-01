import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { AddPointComponent } from '../../country/add-point/add-point.component';
import { IPoint } from 'src/app/models/point';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
  uploadedFile: any;

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

  async onUpload(event: any) {
    if (event.files && event.files.length > 0) {
      this.uploadedFile = event.files[0];
      
      try {
        const formData = new FormData();
        formData.append('image', this.uploadedFile);

        const uploadResponse: any = await this.http.post(`${environment.apiUrl}/travels/upload`, formData).toPromise();
        const imageUrl = uploadResponse.url;

        this.travelForm.patchValue({
          img: imageUrl
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Image uploaded successfully'
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload image'
        });
      }
    }
  }

  loadTravelData(id: string) {
    this.travelService.getTravel().subscribe(travels => {
      const travel = travels.find(t => t.id === id);
      if (travel) {
        this.travelForm.patchValue(travel);
      }
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

  openAddPointForm() {
    if (!this.currentTravelId) return console.log('Нет id');

    const ref = this.dialogService.open(AddPointComponent, {
      width: '70%',
      data: {
        countryId: this.currentTravelId
      },
      header: 'Add New Point'
    });

    ref.onClose.subscribe((point: IPoint) => {
      if (point) {
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Контент добавлен'
        });
      }
    });
  }
}