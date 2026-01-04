import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, Renderer2 } from '@angular/core';
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
import ImageResize from 'quill-image-resize-module';
Quill.register('modules/imageResize', ImageResize);

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
  private quillInstance: any; // Для хранения экземпляра Quill
  private subscriptions: Subscription[] = [];
  private pendingImages: PendingImage[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private travelService: TravelService,
    private authService: AuthService,
    private contentService: CountryContentService,
    private messageService: MessageService,
    private zone: NgZone,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.countryId = this.route.snapshot.paramMap.get('id');
    
    // Проверить права пользователя
    this.subscriptions.push(
      this.authService.userBehavior$.subscribe(user => {
        this.isAdmin = user?.login === 'admin';
        if (!this.isAdmin) {
          this.isEditMode = false;
        }
      })
    );
    // Загрузить данные страны
    this.loadCountryData();
    
    // Загрузить контент
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
          // Инициализируем Quill только после загрузки контента
          setTimeout(() => this.initializeQuill(), 100);
        },
        error: (error) => {
          // Если контента нет, создаем пустой
          this.countryContent = {
            countryId: this.countryId,
            content: ''
          };
          setTimeout(() => this.initializeQuill(), 100);
        }
      })
    );
  }

  // Метод для полного уничтожения Quill
  private destroyQuill(): void {
    if (this.quillInstance) {
      try {
        // Сохраняем контент перед уничтожением
        if (this.quillInstance.root) {
          const content = this.quillInstance.root.innerHTML;
          // Сохраняем контент в переменную компонента
          if (this.countryContent) {
            this.countryContent.content = content;
          }
        }
        
        // Отключаем все обработчики событий
        if (this.quillInstance.events) {
          this.quillInstance.events = {};
        }
        
        // Удаляем экземпляр Quill
        this.quillInstance = null;
        
        // Очищаем DOM элемент
        if (this.editorRef && this.editorRef.nativeElement) {
          this.editorRef.nativeElement.innerHTML = '';
          const container = this.editorRef.nativeElement.parentElement;
          if (container) {
            // Удаляем все дочерние элементы кроме нашего контейнера
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
            // Создаем новый чистый div для редактора
            const newEditorDiv = this.renderer.createElement('div');
            this.renderer.addClass(newEditorDiv, 'quill-editor');
            this.renderer.appendChild(container, newEditorDiv);
            
            // Обновляем ссылку на элемент
            this.editorRef.nativeElement = newEditorDiv;
          }
        }
      } catch (error) {
        console.error('Error destroying Quill:', error);
      }
    }
  }

  // Инициализация Quill с правильными опциями
  private initializeQuill(): void {
  this.destroyQuill();
  
  if (!this.editorRef || !this.editorRef.nativeElement) {
    console.error('Editor element not found');
    return;
  }
  
  // ОЧИЩАЕМ содержимое элемента редактора
  this.editorRef.nativeElement.innerHTML = '';
  
  // ТОЛЬКО для режима редактирования создаем тулбар
  const modules: any = {
    clipboard: {
      matchers: [
        ['IMG', this.imageMatcher.bind(this)]
      ]
    },
    keyboard: {
      bindings: Quill.import('modules/keyboard').bindings
    },
    imageResize: {
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
      displayStyles: {
        backgroundColor: 'black',
        border: '2px solid #87ceeb',
        color: 'white'
      },
      handleStyles: {
        backgroundColor: '#87ceeb',
        border: '1px solid #fff',
        height: '12px',
        width: '12px',
        borderRadius: '50%'
      },
      // Важно: разрешить изменение размера
      displaySize: true,
      // Стандартный метод изменения размера
      resizeImage: true
    }
  };
  
  // В режиме просмотра НЕ добавляем модуль toolbar
  if (this.isEditMode && this.isAdmin) {
    modules.toolbar = {
      container: [
        [{ 'header': [1, false, 2, 3, 4, 5, 6] }], // Header 1 и Normal
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video']
      ],
      handlers: {
        image: () => { this.zone.run(() => this.handleImageUpload()); },
        // Кастомный обработчик для Header 1
        header: (value: any) => {
        if (value === '1') this.applyHeader1Styles();
        else if (value === false) this.applyNormalStyles();
        else this.quillInstance.format('header', value);
        }
      }
    };

  }
  
  this.zone.runOutsideAngular(() => {
    try {
      this.quillInstance = new Quill(this.editorRef.nativeElement, {
        theme: this.isEditMode && this.isAdmin ? 'snow' : 'bubble', // Используем 'bubble' для режима просмотра
        modules: modules,
        readOnly: !(this.isEditMode && this.isAdmin),
        placeholder: this.isEditMode ? 'Начните вводить текст...' : ''
      });
      
      if (this.countryContent?.content) {
        setTimeout(() => {
          if (this.quillInstance && this.quillInstance.root) {
            this.quillInstance.root.innerHTML = this.countryContent.content;
          }
        }, 0);
      }
      
      // СКРЫВАЕМ тулбар в режиме просмотра
      if (!(this.isEditMode && this.isAdmin)) {
        setTimeout(() => {
          const toolbar = this.editorRef.nativeElement.querySelector('.ql-toolbar');
          if (toolbar) {
            toolbar.style.display = 'none';
            toolbar.remove(); // Полностью удаляем из DOM
          }
          
          // Также скрываем контейнер тулбара, если он существует
          const toolbarContainer = this.editorRef.nativeElement.parentElement.querySelector('.ql-toolbar-container');
          if (toolbarContainer) {
            toolbarContainer.style.display = 'none';
            toolbarContainer.remove();
          }
        }, 50);
      }
    } catch (error) {
      console.error('Error initializing Quill:', error);
    }
  });
}

private applyHeader1Styles(): void {
  if (!this.quillInstance) return;
  
  // Получаем текущий формат в позиции курсора
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Применяем все стили сразу
  this.quillInstance.format('header', 1);
  this.quillInstance.format('size', 'large');
  this.quillInstance.format('align', 'center');
  this.quillInstance.format('color', '#ffffff');
}

private applyNormalStyles(): void {
  if (!this.quillInstance) return;
  
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Сбрасываем header и применяем стили для обычного текста
  this.quillInstance.format('header', false);
  this.quillInstance.format('size', false);
  this.quillInstance.format('align', 'justify');
  this.quillInstance.format('color', '#ffffff'); // Белый цвет
  
  // Убедимся, что шрифт normal
  this.quillInstance.format('font', false); // Сброс кастомного шрифта
}

  private imageMatcher(node: any, delta: any): any {
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src');
      if (src.startsWith('blob:')) {
        return delta.compose({
          retain: delta.length(),
          insert: { image: src }
        });
      }
    }
    return delta;
  }

  private async handleImageUpload(): Promise<void> {
    if (!this.quillInstance) return;
    
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.style.display = 'none';
      
      input.addEventListener('change', async () => {
        if (input.files && input.files[0]) {
          const file = input.files[0];
          
          if (!this.validateImageFile(file)) {
            resolve();
            return;
          }
          
          const range = this.quillInstance.getSelection();
          if (!range) {
            resolve();
            return;
          }
          
          const placeholderId = `img-${Date.now()}`;
          const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNMzAgMjBDMjYuMTQgMjAgMjMgMjMuMTQgMjMgMjdDMjMgMzAuODYgMjYuMTQgMzQgMzAgMzRDMzMuODYgMzQgMzcgMzAuODYgMzcgMjdDMzcgMjMuMTQgMzMuODYgMjAgMzAgMjBaTTMwIDM3QzI0LjQ4IDM3IDIwIDMyLjUyIDIwIDI3QzIwIDIxLjQ4IDI0LjQ4IDE3IDMwIDE3QzM1LjUyIDE3IDQwIDIxLjQ4IDQwIDI3QzQwIDMyLjUyIDM1LjUyIDM3IDMwIDM3Wk0xMi41IDQ1QzExLjEyIDQ1IDEwIDQzLjg4IDEwIDQyLjVWMTAuNUMxMCA5LjEyIDExLjEyIDggMTIuNSA4SDQ3LjVDNDguODggOCA1MCA5LjEyIDUwIDEwLjVWNDIuNUM1MCA0My44OCA0OC44OCA0NSA0Ny41IDQ1SDEyLjVaTTEyLjUgNDIuNUg0Ny41VjEwLjVIMTIuNVY0Mi41WiIgZmlsbD0iI0JCQiIvPjwvc3ZnPg==';
          
          this.quillInstance.insertEmbed(range.index, 'image', placeholderSrc);
          this.quillInstance.setSelection(range.index + 1, 0);
          
          try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await this.contentService.uploadImage(formData).toPromise();
            const fullImageUrl = this.getImageUrl(response.url);
            
            const content = this.quillInstance.root.innerHTML;
            const updatedContent = content.replace(placeholderSrc, fullImageUrl);
            this.quillInstance.root.innerHTML = updatedContent;
            
          } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Ошибка',
              detail: 'Не удалось загрузить изображение'
            });
            
            const content = this.quillInstance.root.innerHTML;
            const updatedContent = content.replace(
              `<img src="${placeholderSrc}">`, 
              ''
            );
            this.quillInstance.root.innerHTML = updatedContent;
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
    if (file.size > 10 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Размер файла не должен превышать 10MB'
      });
      return false;
    }
    
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
    if (!this.isAdmin || !this.quillInstance) return;

    this.isSaving = true;
    
    const content = this.quillInstance.root.innerHTML;
    
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
        
        // Переинициализируем Quill в режиме просмотра
        setTimeout(() => {
          this.initializeQuill();
        }, 100);
        
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

  toggleEditMode(): void {
  if (this.isAdmin) {
    this.isEditMode = !this.isEditMode;
    
    // Сохраняем текущий контент перед переключением режима
    if (this.quillInstance && this.quillInstance.root) {
      const currentContent = this.quillInstance.root.innerHTML;
      if (this.countryContent) {
        this.countryContent.content = currentContent;
      }
    }
    
    // Полностью пересоздаем Quill с новыми параметрами
    setTimeout(() => {
      this.initializeQuill();
    }, 0);
  }
}

  goBack(): void {
    this.router.navigate(['/travels']);
  }

  ngOnDestroy(): void {
    // Уничтожаем Quill при уничтожении компонента
    this.destroyQuill();
    
    // Освобождаем временные URLs
    this.pendingImages.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    
    // Отписываемся от всех подписок
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    
    if (path.startsWith('http') || path.startsWith('//') || path.startsWith('blob:')) {
      return path;
    }
    
    if (path.startsWith('/uploads/')) {
      return `${environment.apiUrl}${path}`;
    }
    
    if (path.startsWith('uploads/')) {
      return `${environment.apiUrl}/${path}`;
    }
    
    if (!path.includes('/') && path.includes('.')) {
      return `${environment.apiUrl}/uploads/${path}`;
    }
    
    return `${environment.apiUrl}${path}`;
  }
}