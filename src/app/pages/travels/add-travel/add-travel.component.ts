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
import { CountryCoordinatesService } from 'src/app/services/coordinates/coordinates.sevice';
// Импортируем интерфейс ICoordinates из сервиса координат
import { ICoordinates } from 'src/app/services/coordinates/coordinates.sevice';

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
  
  // Состояния для координат
  showCoordinatesForm = false;
  existingCoordinates: ICoordinates | null = null;
  isEditingCoordinates = false;
  coordinatesHistory: ICoordinates[] = []; // Для отслеживания изменений
  originalCoordinates: ICoordinates | null = null; // Для отмены изменений

  @ViewChild('flagUpload') flagUpload!: FileUpload;
  @ViewChild('imageUpload') imageUpload!: FileUpload;

  constructor(
    private fb: FormBuilder,
    private travelService: TravelService,
    private coordinatesService: CountryCoordinatesService,
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

    // Подписываемся на изменение страны для проверки координат
    this.travelForm.get('country')?.valueChanges.subscribe(country => {
      if (country && country.length > 2) {
        this.checkCoordinates(country);
      }
    });
  }

  createForm() {
    this.travelForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      short_description: ['', Validators.required],
      description: ['', Validators.required],
      flag: [''],
      img: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]],
      featured: [false],
      coordinates: this.fb.group({
        latitude: ['', [Validators.pattern(/^-?\d*\.?\d+$/)]],
        longitude: ['', [Validators.pattern(/^-?\d*\.?\d+$/)]]
      })
    });
  }

  checkCoordinates(country: string) {
    this.coordinatesService.getCoordinatesByCountry(country).subscribe({
      next: (coord) => {
        if (coord && coord.latitude !== 0 && coord.longitude !== 0) {
          this.existingCoordinates = coord;
          this.originalCoordinates = { ...coord };
          this.showCoordinatesForm = false;
          this.isEditingCoordinates = false;
          
          // Заполняем координаты в форме
          this.travelForm.patchValue({
            coordinates: {
              latitude: coord.latitude,
              longitude: coord.longitude
            }
          });

          // Загружаем историю изменений
          this.loadCoordinatesHistory(country);
        } else {
          this.existingCoordinates = null;
          this.originalCoordinates = null;
          this.showCoordinatesForm = true;
          this.isEditingCoordinates = true;
        }
      },
      error: () => {
        this.existingCoordinates = null;
        this.originalCoordinates = null;
        this.showCoordinatesForm = true;
        this.isEditingCoordinates = true;
      }
    });
  }

  loadCoordinatesHistory(country: string) {
    // Здесь можно загрузить историю изменений, если она хранится на сервере
    // Пока просто имитируем
    this.coordinatesHistory = [];
  }

  // Режим редактирования координат
  enableCoordinatesEdit() {
    this.isEditingCoordinates = true;
    this.showCoordinatesForm = true;
    
    // Заполняем форму текущими координатами для редактирования
    if (this.existingCoordinates) {
      this.travelForm.patchValue({
        coordinates: {
          latitude: this.existingCoordinates.latitude,
          longitude: this.existingCoordinates.longitude
        }
      });
    }
  }

  // Отмена редактирования
  cancelCoordinatesEdit() {
    this.isEditingCoordinates = false;
    this.showCoordinatesForm = false;
    
    // Возвращаем оригинальные координаты в форму
    if (this.originalCoordinates) {
      this.travelForm.patchValue({
        coordinates: {
          latitude: this.originalCoordinates.latitude,
          longitude: this.originalCoordinates.longitude
        }
      });
      this.existingCoordinates = { ...this.originalCoordinates };
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Отмена',
      detail: 'Редактирование координат отменено'
    });
  }

  // Сохранение координат (новых или обновленных)
  saveCoordinates() {
    const country = this.travelForm.get('country')?.value;
    const coordinates = this.travelForm.get('coordinates')?.value;

    if (!country) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Предупреждение',
        detail: 'Сначала укажите страну'
      });
      return;
    }

    if (!coordinates.latitude || !coordinates.longitude) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Предупреждение',
        detail: 'Заполните все поля координат'
      });
      return;
    }

    // Валидация координат
    const lat = parseFloat(coordinates.latitude);
    const lng = parseFloat(coordinates.longitude);

    if (lat < -90 || lat > 90) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Предупреждение',
        detail: 'Широта должна быть в диапазоне от -90 до 90'
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Предупреждение',
        detail: 'Долгота должна быть в диапазоне от -180 до 180'
      });
      return;
    }

    const coordData: ICoordinates = {
      country: country,
      latitude: lat,
      longitude: lng
    };

    const operation = this.existingCoordinates
      ? this.coordinatesService.updateCoordinates(country, coordData)
      : this.coordinatesService.createCoordinates(coordData);

    operation.subscribe({
      next: (savedCoord) => {
        // Сохраняем в историю
        if (this.existingCoordinates) {
          this.coordinatesHistory.unshift({
            ...this.existingCoordinates,
            updatedAt: new Date()
          });
        }

        this.existingCoordinates = savedCoord;
        this.originalCoordinates = { ...savedCoord };
        this.showCoordinatesForm = false;
        this.isEditingCoordinates = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: this.existingCoordinates 
            ? 'Координаты обновлены' 
            : 'Координаты сохранены'
        });

        // Обновляем форму
        this.travelForm.patchValue({
          coordinates: {
            latitude: savedCoord.latitude,
            longitude: savedCoord.longitude
          }
        });
      },
      error: (err) => {
        console.error('Ошибка сохранения координат:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось сохранить координаты'
        });
      }
    });
  }

  // Сброс координат к оригинальным
  resetCoordinates() {
    if (this.originalCoordinates) {
      this.travelForm.patchValue({
        coordinates: {
          latitude: this.originalCoordinates.latitude,
          longitude: this.originalCoordinates.longitude
        }
      });
      this.existingCoordinates = { ...this.originalCoordinates };
      this.isEditingCoordinates = false;
      this.showCoordinatesForm = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Сброс',
        detail: 'Координаты сброшены к исходным значениям'
      });
    }
  }

  // Удаление координат
  deleteCoordinates() {
    if (!this.existingCoordinates) return;

    if (confirm('Вы уверены, что хотите удалить координаты для этой страны?')) {
      this.coordinatesService.deleteCoordinates(this.existingCoordinates.country).subscribe({
        next: () => {
          this.existingCoordinates = null;
          this.originalCoordinates = null;
          this.showCoordinatesForm = true;
          this.isEditingCoordinates = true;
          
          // Очищаем поля координат в форме
          this.travelForm.patchValue({
            coordinates: {
              latitude: '',
              longitude: ''
            }
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Координаты удалены'
          });
        },
        error: (err) => {
          console.error('Ошибка удаления координат:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить координаты'
          });
        }
      });
    }
  }

  // Получение подсказок для координат (опционально)
  getCoordinatesHint() {
    const country = this.travelForm.get('country')?.value;
    if (!country) return;

    // Здесь можно добавить интеграцию с геокодером
    // Например, через Nominatim API
    this.isLoading = true;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          this.travelForm.patchValue({
            coordinates: {
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6)
            }
          });

          this.messageService.add({
            severity: 'info',
            summary: 'Подсказка',
            detail: `Найдены координаты: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          });
        }
      })
      .catch(err => console.error('Error fetching coordinates hint:', err))
      .finally(() => this.isLoading = false);
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

        // Загружаем координаты для страны
        this.checkCoordinates(travel.country);

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
    
    // Валидация координат перед сохранением
    const country = this.travelForm.get('country')?.value;
    const coordsGroup = this.travelForm.get('coordinates');
    const lat = coordsGroup?.get('latitude')?.value;
    const lng = coordsGroup?.get('longitude')?.value;

    // Если страна есть, но координаты не заполнены или не сохранены
    if (country && (!lat || !lng) && !this.existingCoordinates) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Внимание',
        detail: 'Для новой страны необходимо указать координаты'
      });
      this.showCoordinatesForm = true;
      this.isEditingCoordinates = true;
      return;
    }

    if (this.travelForm.valid) {
      const formValue = this.travelForm.value;
      
      const travelData: ITravel = {
        id: this.isEditMode ? this.currentTravelId : this.generateId(),
        country: formValue.country,
        city: formValue.city,
        short_description: formValue.short_description,
        description: formValue.description,
        flag: formValue.flag,
        img: formValue.img,
        year: formValue.year,
        featured: formValue.featured
      };

      const operation = this.isEditMode 
        ? this.travelService.updateTravel(this.currentTravelId, travelData)
        : this.travelService.createTravel(travelData);

      operation.subscribe({
        next: () => {
          // Если есть несохраненные координаты, сохраняем их
          if (this.isEditingCoordinates && formValue.coordinates.latitude && formValue.coordinates.longitude) {
            this.saveCoordinates();
          }

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
      // Сначала удаляем координаты (опционально), затем путешествие
      const country = this.travelForm.get('country')?.value;
      
      if (this.existingCoordinates) {
        this.coordinatesService.deleteCoordinates(country).subscribe({
          next: () => {
            this.deleteTravel();
          },
          error: (err) => {
            console.error('Ошибка при удалении координат:', err);
            // Все равно пытаемся удалить путешествие
            this.deleteTravel();
          }
        });
      } else {
        this.deleteTravel();
      }
    }
  }

  private deleteTravel() {
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
        console.error('Ошибка при удалении путешествия:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить путешествие'
        });
      }
    });
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