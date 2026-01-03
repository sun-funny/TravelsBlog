import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TravelService } from 'src/app/services/travel/travel.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CountryContentService } from 'src/app/services/country-content/country-content.service';
import { ITravel } from 'src/app/models/travel';
import { ICountryContent } from 'src/app/models/country-content';
import { MessageService } from 'primeng/api';
import Quill from 'quill';
import { environment } from 'src/environments/environment';

interface PendingImage {
  file: File;
  url: string;
  index: number;
}

@Component({
  selector: 'app-country-content',
  templateUrl: './country-content.component.html',
  styleUrls: ['./country-content.component.scss']
})
export class CountryContentComponent implements OnInit, OnDestroy {
  @ViewChild('editor', { static: false }) editorRef: ElementRef;
  
  countryId: string;
  travel: ITravel;
  countryContent: ICountryContent;
  isAdmin = false;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  
  private quill: Quill;
  private subscriptions: Subscription[] = [];
  private pendingImages: PendingImage[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private travelService: TravelService,
    private authService: AuthService,
    private contentService: CountryContentService,
    private messageService: MessageService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.countryId = this.route.snapshot.paramMap.get('id');
    
    // Проверяем права пользователя
    this.subscriptions.push(
      this.authService.userBehavior$.subscribe(user => {
        this.isAdmin = user?.login === 'admin';
      })
    );

    // Загружаем данные страны
    this.loadCountryData();
    
    // Загружаем контент
    this.loadCountryContent();
  }

  private loadCountryData(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.travelService.getTravelById(this.countryId).subscribe({
        next: (travel) => {
          this.travel = travel;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading country:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить информацию о стране'
          });
          this.isLoading = false;
        }
      })
    );
  }

  private loadCountryContent(): void {
  this.subscriptions.push(
    this.contentService.getContent(this.countryId).subscribe({
      next: (content) => {
        this.countryContent = content;
        setTimeout(() => this.initializeQuill(), 0);
      },
      error: (error) => {
        // Если контента нет, создаем пустой
        this.countryContent = {
          countryId: this.countryId,
          content: ''
        };
        setTimeout(() => this.initializeQuill(), 0);
      }
    })
  );
}

  private initializeQuill(): void {
  if (this.editorRef && this.editorRef.nativeElement) {
    // Определяем опции тулбара
    const toolbarOptions: any[] = [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video']
    ];

    // Инициализируем Quill ВНЕ angular zone
    this.zone.runOutsideAngular(() => {
        this.quill = new Quill(this.editorRef.nativeElement, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: toolbarOptions,
              handlers: {
                image: () => {
                  this.zone.run(() => {
                    this.handleImageUpload();
                  });
                }
              }
            },
            // Добавьте эту опцию для временных ссылок
            clipboard: {
              matchers: [
                ['IMG', this.imageMatcher.bind(this)]
              ]
            }
          }
        });
      });

      
    // Устанавливаем начальное содержимое
    if (this.countryContent?.content) {
      // Используем setTimeout для избежания конфликтов с циклом изменений
      setTimeout(() => {
        if (this.quill) {
          this.quill.root.innerHTML = this.countryContent.content;
        }
      }, 0);
    }

    // Отключаем редактор если не админ
    if (!this.isAdmin && this.quill) {
      this.quill.disable();
    }
  }
}

private imageMatcher(node: any, delta: any): any {
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src');
      if (src.startsWith('blob:')) {
        // Это временное изображение, оставляем как есть
        return delta.compose({
          retain: delta.length(),
          insert: { image: src }
        });
      }
    }
    return delta;
  }

private async handleImageUpload(): Promise<void> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.style.display = 'none';
    
    input.addEventListener('change', async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Валидация
        if (!this.validateImageFile(file)) {
          resolve();
          return;
        }
        
        // Вставляем placeholder
        const range = this.quill.getSelection();
        if (!range) {
          resolve();
          return;
        }
        
        // Вставляем placeholder (пустое изображение с loader)
        const placeholderId = `img-${Date.now()}`;
        const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNMzAgMjBDMjYuMTQgMjAgMjMgMjMuMTQgMjMgMjdDMjMgMzAuODYgMjYuMTQgMzQgMzAgMzRDMzMuODYgMzQgMzcgMzAuODYgMzcgMjdDMzcgMjMuMTQgMzMuODYgMjAgMzAgMjBaTTMwIDM3QzI0LjQ4IDM3IDIwIDMyLjUyIDIwIDI3QzIwIDIxLjQ4IDI0LjQ4IDE3IDMwIDE3QzM1LjUyIDE3IDQwIDIxLjQ4IDQwIDI3QzQwIDMyLjUyIDM1LjUyIDM3IDMwIDM3Wk0xMi41IDQ1QzExLjEyIDQ1IDEwIDQzLjg4IDEwIDQyLjVWMTAuNUMxMCA5LjEyIDExLjEyIDggMTIuNSA4SDQ3LjVDNDguODggOCA1MCA5LjEyIDUwIDEwLjVWNDIuNUM1MCA0My44OCA0OC44OCA0NSA0Ny41IDQ1SDEyLjVaTTEyLjUgNDIuNUg0Ny41VjEwLjVIMTIuNVY0Mi41WiIgZmlsbD0iI0JCQiIvPjwvc3ZnPg==';
        
        this.quill.insertEmbed(range.index, 'image', placeholderSrc);
        this.quill.setSelection(range.index + 1, 0);
        
        try {
          // Загружаем изображение
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await this.contentService.uploadImage(formData).toPromise();
          
          // Получаем полный URL
          const fullImageUrl = this.getImageUrl(response.url);
          
          // Заменяем placeholder на реальное изображение
          const content = this.quill.root.innerHTML;
          const updatedContent = content.replace(
            placeholderSrc, 
            fullImageUrl
          );
          this.quill.root.innerHTML = updatedContent;
          
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить изображение'
          });
          
          // Удаляем placeholder при ошибке
          const content = this.quill.root.innerHTML;
          const updatedContent = content.replace(
            `<img src="${placeholderSrc}">`, 
            ''
          );
          this.quill.root.innerHTML = updatedContent;
        }
      }
      
      document.body.removeChild(input);
      resolve();
    });
    
    document.body.appendChild(input);
    input.click();
  });
}

private validateImageFile(file: File): boolean {
  // Валидация размера
  if (file.size > 10 * 1024 * 1024) {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Размер файла не должен превышать 10MB'
    });
    return false;
  }
  
  // Валидация типа
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Допустимые форматы: JPEG, PNG, GIF, WebP'
    });
    return false;
  }
  
  return true;
}


saveContent(): void {
  if (!this.isAdmin || !this.quill) return;

  this.isSaving = true;
  
  // Получаем очищенный контент
  const content = this.quill.root.innerHTML;
  
  // Убедимся, что в контенте нет blob изображений
  if (content.includes('blob:')) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Внимание',
      detail: 'Пожалуйста, дождитесь загрузки всех изображений'
    });
    this.isSaving = false;
    return;
  }

  const user = this.authService.getCurrentUser();
  const countryContent: ICountryContent = {
    _id: this.countryContent?._id,
    countryId: this.countryId,
    content: content,
    updatedAt: new Date(),
    updatedBy: user?.login || 'admin'
  };

  this.contentService.saveContent(countryContent).subscribe({
    next: (savedContent) => {
      this.countryContent = savedContent;
      this.isEditMode = false;
      this.isSaving = false;
      
      // Освобождаем все временные URLs
      this.pendingImages.forEach(img => {
        URL.revokeObjectURL(img.url);
      });
      this.pendingImages = [];
      
      if (this.quill) {
        this.quill.disable();
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Успех',
        detail: 'Контент сохранен'
      });
    },
    error: (error) => {
      console.error('Error saving content:', error);
      this.isSaving = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.message || 'Не удалось сохранить контент'
      });
    }
  });
}

private extractTempImageUrls(content: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const images = doc.querySelectorAll('img');
  const tempUrls: string[] = [];
  
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('blob:')) {
      tempUrls.push(src);
    }
  });
  
  return tempUrls;
}

private async uploadAndReplaceImages(tempUrls: string[]): Promise<void> {
  const uploadPromises = tempUrls.map(async (tempUrl) => {
    // Находим файл по временному URL
    const pendingImage = this.pendingImages.find(img => img.url === tempUrl);
    
    if (!pendingImage) {
      console.warn('No pending image found for URL:', tempUrl);
      return null;
    }
    
    const formData = new FormData();
    formData.append('image', pendingImage.file);
    
    try {
      const response = await this.contentService.uploadImage(formData).toPromise();
      const finalUrl = `${environment.apiUrl}${response.url}`;
      
      // Заменяем временную ссылку на постоянную
      const content = this.quill.root.innerHTML;
      const updatedContent = content.replace(tempUrl, finalUrl);
      this.quill.root.innerHTML = updatedContent;
      
      // Освобождаем временную URL
      URL.revokeObjectURL(tempUrl);
      
      // Удаляем из pendingImages
      this.pendingImages = this.pendingImages.filter(img => img.url !== tempUrl);
      
      return finalUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  });
  
  await Promise.all(uploadPromises);
}

  private async uploadPendingImages(): Promise<void> {
    const uploadPromises = this.pendingImages.map(async (pendingImage) => {
      const formData = new FormData();
      formData.append('image', pendingImage.file);
      
      try {
        const response = await this.contentService.uploadImage(formData).toPromise();
        const finalUrl = `${environment.apiUrl}${response.url}`;
        
        // Заменяем временную ссылку на постоянную в редакторе
        const content = this.quill.root.innerHTML;
        const updatedContent = content.replace(pendingImage.url, finalUrl);
        this.quill.root.innerHTML = updatedContent;
        
        // Освобождаем временную URL
        URL.revokeObjectURL(pendingImage.url);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to upload image:', error);
        return { success: false, error };
      }
    });
    
    await Promise.all(uploadPromises);
    this.pendingImages = []; // Очищаем массив временных изображений
  }

  private saveFinalContent(): void {
    const content = this.quill.root.innerHTML;
    
    const user = this.authService.getCurrentUser();
    const countryContent: ICountryContent = {
      _id: this.countryContent?._id,
      countryId: this.countryId,
      content: content,
      updatedAt: new Date(),
      updatedBy: user?.login || 'admin'
    };

    this.subscriptions.push(
      this.contentService.saveContent(countryContent).subscribe({
        next: (savedContent) => {
          this.countryContent = savedContent;
          this.isEditMode = false;
          this.quill.disable();
          this.isSaving = false;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Контент сохранен'
          });
        },
        error: (error) => {
          console.error('Error saving content:', error);
          this.isSaving = false;
          
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: error.message || 'Не удалось сохранить контент'
          });
        }
      })
    );
  }
private logContentImages(): void {
  if (this.quill) {
    const content = this.quill.root.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = doc.querySelectorAll('img');
    
    console.log('Found images in content:', images.length);
    images.forEach((img, index) => {
      console.log(`Image ${index + 1}:`, img.getAttribute('src'));
    });
  }
}
  toggleEditMode(): void {
    if (this.isAdmin) {
      this.isEditMode = !this.isEditMode;
      if (this.isEditMode && this.quill) {
        this.quill.enable();
      } else if (this.quill) {
        this.quill.disable();
      }
    }
  }

  // Отмена изменений
   cancelEdit(): void {
    this.isEditMode = false;
    
    // Освобождаем все временные URLs
    this.pendingImages.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    this.pendingImages = [];
    
    if (this.quill) {
      if (this.countryContent?.content) {
        this.quill.root.innerHTML = this.countryContent.content;
      }
      this.quill.disable();
    }
  }

  goBack(): void {
    this.router.navigate(['/travels']);
  }

  ngOnDestroy(): void {
    // Освобождаем временные URLs при уничтожении компонента
    this.pendingImages.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getImageUrl(path: string): string {
  if (!path) return '';
  
  // Проверяем различные форматы URL
  if (path.startsWith('http') || path.startsWith('//')) {
    return path;
  }
  
  if (path.startsWith('blob:')) {
    return path; // Это временное изображение
  }
  
  if (path.startsWith('/uploads/')) {
    // Сервер возвращает относительный путь /uploads/filename.jpg
    return `${environment.apiUrl}${path}`;
  }
  
  if (path.startsWith('uploads/')) {
    // Без ведущего слеша
    return `${environment.apiUrl}/${path}`;
  }
  
  if (!path.includes('/') && path.includes('.')) {
    // Просто имя файла
    return `${environment.apiUrl}/uploads/${path}`;
  }
  
  return `${environment.apiUrl}${path}`;
}
}