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
  // Уничтожаем только если уже существует
  if (this.quillInstance) {
    this.destroyQuill();
  }
  
  if (!this.editorRef || !this.editorRef.nativeElement) {
    console.error('Editor element not found');
    return;
  }
  
  // Сохраняем позицию курсора перед инициализацией
  const previousSelection = this.quillInstance?.getSelection();
  
  // Используем старый контент или загруженный
  const contentToLoad = this.countryContent?.content || '';
  
  this.editorRef.nativeElement.innerHTML = '';
  
  const modules: any = {
    clipboard: {
      matchers: [
        ['IMG', this.imageMatcher.bind(this)]
      ]
    },
    keyboard: {
      bindings: Quill.import('modules/keyboard').bindings
    }
  };
  
  if (this.isEditMode && this.isAdmin) {
    modules.toolbar = {
      container: [
        [{ 'header': [1, false, 2, 3, 4, 5, 6] }],
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
  image: () => {
    this.zone.run(() => {
      this.handleImageUpload();
    });
  },
  header: (value: any) => {
    this.zone.run(() => {
      if (value === '1') {
        this.applyHeader1Styles();
      } else if (value === false) {
        this.applyNormalStyles();
      } else {
        this.applyFormatSafely('header', value);
      }
    });
  },
  // Добавьте для других форматов
  bold: () => this.applyFormatSafely('bold', true),
  italic: () => this.applyFormatSafely('italic', true),
  underline: () => this.applyFormatSafely('underline', true),
  strike: () => this.applyFormatSafely('strike', true),
  color: (value: string) => this.applyFormatSafely('color', value),
  background: (value: string) => this.applyFormatSafely('background', value)
}
    };
  }
  
  this.zone.runOutsideAngular(() => {
    try {
      this.quillInstance = new Quill(this.editorRef.nativeElement, {
        theme: (this.isEditMode && this.isAdmin) ? 'snow' : 'bubble',
        modules: modules,
        readOnly: !(this.isEditMode && this.isAdmin),
        placeholder: this.isEditMode ? 'Начните вводить текст...' : ''
      });
      
      // Устанавливаем контент синхронно
      if (contentToLoad) {
        this.quillInstance.clipboard.dangerouslyPasteHTML(0, contentToLoad);
      }
      
      // Восстанавливаем позицию курсора после загрузки контента
      setTimeout(() => {
        if (previousSelection && previousSelection.index >= 0) {
          try {
            this.quillInstance.setSelection(previousSelection.index, previousSelection.length);
          } catch (e) {
            // Если не удалось восстановить, ставим в конец
            const length = this.quillInstance.getLength();
            this.quillInstance.setSelection(length, 0);
          }
        }
      }, 10);
      
      // Подписываемся на события форматирования
      if (this.isEditMode && this.isAdmin) {
        this.setupFormatHandlers();
      }
      
      // Скрываем тулбар в режиме просмотра
      if (!(this.isEditMode && this.isAdmin)) {
        setTimeout(() => {
          const toolbar = this.editorRef.nativeElement.querySelector('.ql-toolbar');
          if (toolbar) {
            toolbar.style.display = 'none';
          }
        }, 50);
      }
      
    } catch (error) {
      console.error('Error initializing Quill:', error);
    }
  });
}

// Добавьте новый метод для настройки обработчиков форматирования
private setupFormatHandlers(): void {
  if (!this.quillInstance) return;
  
  // Обработчик для форматирования текста
  this.quillInstance.on('editor-change', (eventType: string, ...args: any[]) => {
    if (eventType === 'selection-change') {
      // Сохраняем позицию курсора при изменении выделения
      this.saveCursorPosition();
    } else if (eventType === 'text-change') {
      // Сохраняем позицию курсора при изменении текста
      this.saveCursorPosition();
    }
  });
}

// Метод для сохранения позиции курсора
private saveCursorPosition(): void {
  if (!this.quillInstance) return;
  
  const selection = this.quillInstance.getSelection();
  if (selection) {
    // Можно сохранить в локальное хранилище или переменную
    sessionStorage.setItem('quillCursorPosition', JSON.stringify(selection));
  }
}

// Метод для восстановления позиции курсора
private restoreCursorPosition(): void {
  if (!this.quillInstance) return;
  
  const savedPosition = sessionStorage.getItem('quillCursorPosition');
  if (savedPosition) {
    try {
      const position = JSON.parse(savedPosition);
      setTimeout(() => {
        this.quillInstance.setSelection(position.index, position.length);
      }, 100);
    } catch (e) {
      console.error('Error restoring cursor position:', e);
    }
  }
}

private applyFormatSafely(format: string, value: any): void {
  if (!this.quillInstance) return;
  
  // Сохраняем текущую позицию курсора
  const currentSelection = this.quillInstance.getSelection();
  if (!currentSelection) return;
  
  // Применяем форматирование
  this.quillInstance.format(format, value);
  
  // Восстанавливаем фокус и позицию курсора
  setTimeout(() => {
    try {
      this.quillInstance.setSelection(currentSelection.index, currentSelection.length);
      this.quillInstance.focus();
    } catch (e) {
      console.error('Error restoring cursor after format:', e);
    }
  }, 0);
}

// Для заголовка Header 1
private applyHeader1Styles(): void {
  if (!this.quillInstance) return;
  
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Используем безопасное применение
  this.applyFormatSafely('header', 1);
  this.applyFormatSafely('size', 'large');
  this.applyFormatSafely('align', 'center');
  this.applyFormatSafely('color', '#520d0dff');
}

// Для обычного текста
private applyNormalStyles(): void {
  if (!this.quillInstance) return;
  
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Используем безопасное применение
  this.applyFormatSafely('header', false);
  this.applyFormatSafely('size', false);
  this.applyFormatSafely('align', 'justify');
  this.applyFormatSafely('color', '#ffffff');
  this.applyFormatSafely('font', false);
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
    // Сохраняем текущий контент и позицию курсора
    if (this.quillInstance && this.quillInstance.root) {
      const currentContent = this.quillInstance.root.innerHTML;
      if (this.countryContent) {
        this.countryContent.content = currentContent;
      }
      
      // Сохраняем позицию курсора
      this.saveCursorPosition();
    }
    
    this.isEditMode = !this.isEditMode;
    
    // Используем небольшую задержку для плавного переключения
    setTimeout(() => {
      this.initializeQuill();
      
      // Восстанавливаем позицию курсора после инициализации
      if (this.isEditMode) {
        setTimeout(() => {
          this.restoreCursorPosition();
        }, 200);
      }
    }, 50);
  }
}

  goBack(): void {
    this.router.navigate(['/travels']);
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('quillCursorPosition');

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