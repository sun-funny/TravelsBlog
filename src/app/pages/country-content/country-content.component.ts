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
import { registerCustomBlots } from 'src/app/quill/quill-custom-blots';

interface PendingImage {
  file: File;
  url: string;
  index: number;
}

// Карусель
interface CarouselImage {
  url: string;     // для Angular шаблона
  rawUrl: string;  // 🔥 для Quill (НЕ санитизируется)
  file?: File;
  isUploading?: boolean;
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

  // Переменные для карусели изображений
  carouselImages: CarouselImage[] = [];
  selectedImageIndex: number = 0;
  isUploadingImages: boolean = false;
  showImageUploadModal: boolean = false;
  
  private quill: Quill;
  private quillInstance: any;
  private subscriptions: Subscription[] = [];
  private pendingImages: PendingImage[] = [];

  // carusel-quill
  private carouselTempImages: CarouselImage[] = []; // Для внутренней карусели Quill

  // Инициализируйте в ngOnInit или создайте метод для сброса
  private resetCarouselTempImages(): void {
    this.carouselTempImages = [];
  }
  // ===================
  
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
    // Зарегистрируйте кастомные блоки ПЕРЕД инициализацией Quill
    registerCustomBlots();

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

  // Метод для проверки наличия файлов для загрузки
  hasFilesToUpload(): boolean {
    return this.carouselImages.some(img => img.file);
  }

  private loadCountryData(): void {
  this.isLoading = true;
  this.subscriptions.push(
    this.travelService.getTravelById(this.countryId).subscribe({
      next: (travel) => {
        this.travel = travel;

        if (travel.img) {
          this.carouselImages = [
            this.makeCarouselImage(this.getImageUrl(travel.img))
          ];
        }

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

private makeCarouselImage(
  url: string,
  file?: File
): CarouselImage {
  return {
    url,
    rawUrl: url,
    file,
    isUploading: false
  };
}

private loadCountryContent(): void {
  this.subscriptions.push(
    this.contentService.getContent(this.countryId).subscribe({
      next: (content) => {
        this.countryContent = content;
        
        // Загружаем изображения карусели из сохраненного контента
        if (content.carouselImages && content.carouselImages.length > 0) {
          this.carouselImages = content.carouselImages.map(url =>
          this.makeCarouselImage(this.getImageUrl(url))
          );
        } else if (this.travel?.img) {
          this.carouselImages = [
          this.makeCarouselImage(this.getImageUrl(this.travel.img))
          ];
        }
        
        // Инициализируем Quill только после загрузки контента
        setTimeout(() => this.initializeQuill(), 100);
      },
      error: (error) => {
        // Если контента нет, создаем пустой
        this.countryContent = {
          countryId: this.countryId,
          content: ''
        };
        
        // Основное изображение из travel
        if (this.travel?.img) {
          this.carouselImages = [
          this.makeCarouselImage(this.getImageUrl(this.travel.img))
          ];
        }
        
        setTimeout(() => this.initializeQuill(), 100);
      }
    })
  );
}


   // =====================ВНЕШНЯЯ КАРУСЕЛЬ================================

  // Проверка, есть ли изображение уже в карусели
  private isImageInCarousel(url: string): boolean {
    return this.carouselImages.some(img => img.url === url);
  }

  // Открыть модальное окно для загрузки изображений
  openImageUploadModal(): void {
    this.showImageUploadModal = true;
  }

  // Обработчик выбора файлов для карусели
  onCarouselImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files.length) return;

    // Проверяем количество файлов
    const maxImages = 10; // Максимальное количество изображений
    if (this.carouselImages.length + files.length > maxImages) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Внимание',
        detail: `Максимальное количество изображений: ${maxImages}`
      });
      return;
    }

    // Добавляем временные URL для предпросмотра
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!this.validateImageFile(file)) continue;
      
      const rawUrl = URL.createObjectURL(file);

      this.carouselImages.push({
        url: rawUrl,     // ← Angular его засаниитизирует
        rawUrl: rawUrl, // ← НО мы больше НИКОГДА не берём его из template
        file
      });
    }

    // Сбрасываем input
    event.target.value = '';
  }


  // Загрузить выбранные изображения на сервер
async uploadCarouselImages(): Promise<void> {
  const imagesWithFiles = this.carouselImages.filter(img => img.file);
  
  if (imagesWithFiles.length === 0) {
    return Promise.resolve();
  }

  this.isUploadingImages = true;
  const uploadPromises: Promise<void>[] = [];

  for (let i = 0; i < this.carouselImages.length; i++) {
    const image = this.carouselImages[i];
    
    if (image.file && !image.url.startsWith(environment.apiUrl)) {
      uploadPromises.push(this.uploadSingleImage(i));
    }
  }

  try {
    await Promise.all(uploadPromises);
    return Promise.resolve();
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  } finally {
    this.isUploadingImages = false;
  }
}

  // Загрузить одно изображение
  private async uploadSingleImage(index: number): Promise<void> {
  const image = this.carouselImages[index];
  if (!image.file) return;

  image.isUploading = true;

  try {
    const formData = new FormData();
    formData.append('image', image.file);

    const response = await this.contentService.uploadImage(formData).toPromise();
    const fullImageUrl = this.getImageUrl(response.url);

    this.carouselImages[index] = {
      ...image,
      url: fullImageUrl,
      rawUrl: fullImageUrl,
      file: undefined,
      isUploading: false
    };

    if (image.rawUrl.startsWith('blob:')) {
      URL.revokeObjectURL(image.rawUrl);
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    this.carouselImages[index].isUploading = false;
    throw error;
  }
  }


// Удалить изображение из внешней карусели
removeCarouselImage(index: number): void {
  const image = this.carouselImages[index];
  
  // Если изображение уже загружено на сервер, удаляем его
  if (image.url.includes(environment.apiUrl)) {
    const imagePath = this.extractImagePathFromUrl(image.url);
    if (imagePath) {
      this.contentService.deleteImage(imagePath).subscribe({
        next: () => {
          console.log('Изображение удалено с сервера:', imagePath);
        },
        error: (error: any) => { // Явно указали тип
          console.error('Ошибка удаления изображения с сервера:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Не удалось удалить изображение с сервера'
          });
        }
      });
    }
  }
  
  // Освобождаем временный URL если есть
  if (image.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url);
  }
  
  this.carouselImages.splice(index, 1);
  
  // Корректируем выбранный индекс
  if (this.selectedImageIndex >= this.carouselImages.length) {
    this.selectedImageIndex = Math.max(0, this.carouselImages.length - 1);
  }
}

// Вспомогательный метод для извлечения пути изображения из URL
private extractImagePathFromUrl(url: string): string | null {
  try {
    // Если URL уже относительный путь
    if (url.startsWith('/uploads/')) {
      return url;
    }

    // Если URL содержит базовый URL API
    if (url.startsWith(environment.apiUrl)) {
      return url.replace(environment.apiUrl, '');
    }
    // Для полных URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Извлекаем путь после /uploads/
    if (path.includes('/uploads/')) {
      return path;
    }
    return null;
  } catch (error) {
    console.error('Ошибка парсинга URL:', error);
    // Попробуем извлечь путь вручную
    const uploadsIndex = url.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return url.substring(uploadsIndex);
    }
    
    return null;
  }
}

  // Переключение между изображениями во внешней карусели
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  nextImage(): void {
    if (this.carouselImages.length === 0) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.carouselImages.length;
  }

  prevImage(): void {
    if (this.carouselImages.length === 0) return;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
  }

  //===========================================================

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
        ['IMG', this.imageMatcher.bind(this)],
        // Добавляем обработчик для карусели
        ['DIV', this.carouselMatcher.bind(this)]
      ]
    },
    keyboard: {
      // Сохраняем стандартные биндинги и добавляем свои
      bindings: {
        // Стандартные биндинги Quill
        ...Quill.import('modules/keyboard').bindings,
        // Кастомный биндинг для удаления
        deleteCarousel: {
      key: 'Delete',
      handler: (range: any) => {
        if (this.isEditMode && this.isAdmin) {
          const isInCarousel = this.isCursorInCarousel(range);
          if (isInCarousel) {
            this.zone.run(() => {
              this.deleteCarouselAtCursor();
            });
            return false; // Блокируем только если в карусели
          }
        }
        return true; // Разрешаем стандартное удаление
      }
        },
        // Также можно добавить для Backspace
        backspaceDeleteCarousel: {
      key: 'Backspace',
      handler: (range: any) => {
        if (this.isEditMode && this.isAdmin) {
          const isInCarousel = this.isCursorInCarousel(range);
          if (isInCarousel) {
            this.zone.run(() => {
              this.deleteCarouselAtCursor();
            });
            return false; // Блокируем только если в карусели
          }
        }
        return true; // Разрешаем стандартное удаление
      }
    }
      }
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
      // Разрешить изменение размера
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
        ['link', 'image', 'video'],
        ['carousel']
      ],
      handlers: {
        image: () => { this.zone.run(() => this.handleImageUpload()); },
        // Кастомный обработчик для Header 1
        header: (value: any) => {
        if (value === '1') this.applyHeader1Styles();
        else if (value === false) this.applyNormalStyles();
        else this.quillInstance.format('header', value);
        },
        carousel: () => { this.zone.run(() => this.openCarouselImagePicker()); }
      }
    };

  }
  
  this.zone.runOutsideAngular(() => {
    try {
      this.quillInstance = new Quill(this.editorRef.nativeElement, {
        theme: this.isEditMode && this.isAdmin ? 'snow' : 'bubble',
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

        /*setTimeout(() => {
          if (this.isEditMode && this.isAdmin) {
            this.injectCarouselButton();
            }
        }, 0);*/
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
   // После инициализации Quill добавьте обработчики для каруселей
  setTimeout(() => {
    this.initializeAllCarousels();
  }, 100);
  
  // Также обновляйте карусели при изменении контента
  if (this.quillInstance) {
    this.quillInstance.on('text-change', () => {
      setTimeout(() => {
        this.initializeAllCarousels();
      }, 50);
    });
  }

  // Добавляем обработчик для синхронизации каруселей
  if (this.quillInstance) {
      this.quillInstance.on('editor-change', () => {
        setTimeout(() => {
          this.syncCarouselSizes();
        }, 50);
      });
    }

  const icons = Quill.import('ui/icons');
  icons['carousel'] = `
    <svg viewBox="0 0 24 24" width="16" height="16">
      <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  `;

}

// Для внутренней карусели

private isCursorInCarousel(range: any): boolean {
  if (!range || !this.quillInstance) return false;
  
  const [leaf] = this.quillInstance.getLeaf(range.index);
  if (leaf && leaf.parent) {
    const carouselElement = leaf.parent.domNode.closest('.ql-carousel');
    return !!carouselElement;
  }
  
  return false;
}

// Обработчик для копирования/вставки карусели
private carouselMatcher(node: HTMLElement, delta: any): any {
  if (node.classList && node.classList.contains('ql-carousel')) {
    const imagesAttr = node.getAttribute('data-images');
    if (imagesAttr) {
      const images = JSON.parse(imagesAttr);
      return delta.compose({
        retain: delta.length(),
        insert: { carousel: { images } }
      });
    }
  }
  return delta;
}

// Метод для удаления карусели под курсором
private deleteCarouselAtCursor(): void {
  if (!this.quillInstance) return;
  
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  const [leaf] = this.quillInstance.getLeaf(range.index);
  
  if (leaf && leaf.parent) {
    const carouselElement = leaf.parent.domNode.closest('.ql-carousel') as HTMLElement;
    if (carouselElement && confirm('Удалить эту карусель?')) {
      // Находим индекс карусели в редакторе
      const editor = this.quillInstance.scroll.domNode as HTMLElement;
      const allElements = Array.from(editor.childNodes);
      const carouselIndex = allElements.indexOf(carouselElement);
      
      if (carouselIndex !== -1) {
        // Удаляем через API Quill
        this.quillInstance.deleteText(carouselIndex, 1);
      }
    }
  }
}

private initializeAllCarousels(): void {
  const carousels = document.querySelectorAll('.ql-carousel .carousel-wrapper');
  
  carousels.forEach((carousel) => {
    const htmlCarousel = carousel as HTMLElement;
    if (htmlCarousel.id) {
      this.initializeSingleCarousel(htmlCarousel.id);
    }
  });
}

private initializeSingleCarousel(carouselId: string): void {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;
  
  const slides = carousel.querySelectorAll<HTMLDivElement>('.carousel-slide');
  const indicators = carousel.querySelectorAll<HTMLButtonElement>('.carousel-indicator');
  const prevBtn = carousel.querySelector<HTMLButtonElement>('.carousel-btn.prev');
  const nextBtn = carousel.querySelector<HTMLButtonElement>('.carousel-btn.next');
  
  let currentIndex = 0;
  
  const showSlide = (index: number) => {
    // Скрываем все слайды
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? 'block' : 'none';
      slide.style.opacity = i === index ? '1' : '0';
    });
    
    // Обновляем индикаторы
    indicators.forEach((indicator, i) => {
      if (i === index) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    
    currentIndex = index;
  };
  
  // Инициализация
  if (slides.length > 0) {
    showSlide(0);
  }
  
  // Обработчики событий
  prevBtn?.addEventListener('click', () => {
    const newIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(newIndex);
  });
  
  nextBtn?.addEventListener('click', () => {
    const newIndex = (currentIndex + 1) % slides.length;
    showSlide(newIndex);
  });
  
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => showSlide(index));
  });
}

/*private injectCarouselButton(): void {
  const container = this.editorRef.nativeElement.parentElement;
  if (!container) {
    console.warn('Quill container not found');
    return;
  }

  // Проверяем, есть ли уже кнопка
  if (container.querySelector('.insert-carousel-btn')) {
    return;
  }

  const toolbar = container.querySelector('.ql-toolbar');
  if (!toolbar) {
    console.warn('Quill toolbar not found');
    return;
  }

  // Создаем контейнер для кнопки
  const btnWrapper = document.createElement('div');
  btnWrapper.className = 'insert-carousel-btn';
  btnWrapper.style.cssText = `
    margin-top: 10px;
    margin-bottom: 10px;
    text-align: center;
  `;

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<i class="pi pi-images"></i> Вставить карусель`;
  button.className = 'p-button p-button-info';
  button.style.cssText = `
    background: rgba(135, 206, 235, 0.2);
    border: 1px solid rgba(135, 206, 235, 0.4);
    color: #87ceeb;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
  `;

  button.addEventListener('click', () => {
    this.zone.run(() => this.openCarouselImagePicker());
  });

  // Добавляем hover эффект
  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(135, 206, 235, 0.3)';
    button.style.borderColor = 'rgba(135, 206, 235, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(135, 206, 235, 0.2)';
    button.style.borderColor = 'rgba(135, 206, 235, 0.4)';
  });

  btnWrapper.appendChild(button);
  
  // Вставляем после тулбара
  toolbar.insertAdjacentElement('afterend', btnWrapper);
}*/

openCarouselImagePicker(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.style.display = 'none';

  input.addEventListener('change', (event: any) => {
    this.zone.run(() => {
      // Используем новый метод для обработки изображений для Quill карусели
      this.handleCarouselImagesForQuill(event);
    });
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Новый метод для обработки изображений для карусели в Quill
private handleCarouselImagesForQuill(event: any): void {
  const files: FileList = event.target.files;
  if (!files.length) return;

  // Очищаем временные изображения
  this.carouselTempImages = [];

  // Добавляем временные URL для предпросмотра
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!this.validateImageFile(file)) continue;
    
    const rawUrl = URL.createObjectURL(file);

    this.carouselTempImages.push({
      url: rawUrl,
      rawUrl: rawUrl,
      file,
      isUploading: false
    });
  }

  // Если есть изображения, вставляем карусель
  if (this.carouselTempImages.length > 0) {
    this.insertCarouselIntoQuill();
  }
}

async insertCarouselIntoQuill(): Promise<void> {
  if (!this.quillInstance) return;

  if (this.carouselTempImages.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Нет изображений',
      detail: 'Сначала выберите изображения для карусели'
    });
    return;
  }

  try {
    const uploadedUrls = await this.uploadImagesForCarousel();
    
    if (!uploadedUrls.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Нет изображений',
        detail: 'Не удалось загрузить изображения'
      });
      return;
    }

    console.log('Inserting carousel with URLs:', uploadedUrls);
    
    const range = this.quillInstance.getSelection(true);
    const index = range ? range.index : this.quillInstance.getLength();


    // Получаем текущий размер из существующих каруселей с такими же изображениями
      let carouselWidth = '100%';
      const existingCarousels = this.quillInstance.root.querySelectorAll('.ql-carousel');
      
      existingCarousels.forEach((carousel: Element) => {
        const carouselEl = carousel as HTMLElement;
        const existingImagesAttr = carouselEl.getAttribute('data-images');
        
        if (existingImagesAttr && JSON.stringify(existingImagesAttr) === JSON.stringify(uploadedUrls)) {
          const existingWidth = carouselEl.getAttribute('data-width');
          if (existingWidth) {
            carouselWidth = existingWidth;
          }
        }
      });

    // Вставляем карусель как блок с возможностью изменения размера
    try {
      this.quillInstance.insertEmbed(index, 'carousel', { 
        images: uploadedUrls,
        width: carouselWidth
      }, 'user');
      
      console.log('Carousel inserted successfully with width:', carouselWidth);
      
      // Добавляем пустую строку после карусели для удобства
      this.quillInstance.insertText(index + 1, '\n\n');
      
      // Перемещаем курсор после карусели
      this.quillInstance.setSelection(index + 2);
      
      // Инициализируем карусель после вставки
      setTimeout(() => {
        const carousels = this.quillInstance.root.querySelectorAll('.ql-carousel');
        if (carousels.length > 0) {
          const lastCarousel = carousels[carousels.length - 1];
          const wrapper = lastCarousel.querySelector('.carousel-wrapper');
          if (wrapper && wrapper.id) {
            this.initializeSingleCarousel(wrapper.id);
          }
        }
      }, 100);

      // Синхронизируем размеры после вставки
      setTimeout(() => {
        this.syncCarouselSizes();
      }, 100);

      
    } catch (error) {
      console.error('Error inserting carousel embed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось вставить карусель'
      });
    }
    
    this.cleanupCarouselTempImages();
    
  } catch (error) {
    console.error('Error uploading images:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить изображения'
    });
    
    this.cleanupCarouselTempImages();
  }
}

 // Метод для синхронизации размеров всех каруселей
  private syncCarouselSizes(): void {
    if (!this.quillInstance) return;
    
    const carousels = this.quillInstance.root.querySelectorAll('.ql-carousel');
    const sizeMap = new Map<string, string>(); // Карта для хранения размеров по идентификаторам
    
    // Собираем размеры всех уникальных каруселей
    carousels.forEach((carousel: Element) => {
      const carouselEl = carousel as HTMLElement;
      const imagesAttr = carouselEl.getAttribute('data-images');
      const width = carouselEl.getAttribute('data-width') || carouselEl.style.width;
      
      if (imagesAttr && width) {
        sizeMap.set(imagesAttr, width);
      }
    });
    
    // Применяем размеры ко всем каруселям
    carousels.forEach((carousel: Element) => {
      const carouselEl = carousel as HTMLElement;
      const imagesAttr = carouselEl.getAttribute('data-images');
      
      if (imagesAttr && sizeMap.has(imagesAttr)) {
        const width = sizeMap.get(imagesAttr);
        carouselEl.style.width = width || '100%';
        carouselEl.setAttribute('data-width', width || '100%');
      }
    });
  }

// Метод для загрузки изображений для карусели Quill
private async uploadImagesForCarousel(): Promise<string[]> {
  const uploadedUrls: string[] = [];

  // Загружаем каждое изображение
  for (let i = 0; i < this.carouselTempImages.length; i++) {
    const image = this.carouselTempImages[i];
    if (!image.file) continue;

    try {
      image.isUploading = true;
      
      const formData = new FormData();
      formData.append('image', image.file);

      const response = await this.contentService.uploadImage(formData).toPromise();
      const fullImageUrl = this.getImageUrl(response.url);
      uploadedUrls.push(fullImageUrl);
      
      // Освобождаем blob URL
      URL.revokeObjectURL(image.rawUrl);
      
      image.isUploading = false;
    } catch (error) {
      console.error('Error uploading image:', error);
      image.isUploading = false;
      throw error;
    }
  }

  return uploadedUrls;
}

// Очистка временных изображений
private cleanupCarouselTempImages(): void {
  this.carouselTempImages.forEach(img => {
    if (img.rawUrl.startsWith('blob:')) {
      URL.revokeObjectURL(img.rawUrl);
    }
  });
  this.carouselTempImages = [];
}
//==========================


private applyHeader1Styles(): void {
  if (!this.quillInstance) return;
  
  // Получаем текущий формат в позиции курсора
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Применяем все стили сразу
  this.quillInstance.format('header', 1);
  this.quillInstance.format('bold', true);
  this.quillInstance.format('size', 'large');
  this.quillInstance.format('align', 'left');
  this.quillInstance.format('color', '#ffffff');
}

private applyNormalStyles(): void {
  if (!this.quillInstance) return;
  
  const range = this.quillInstance.getSelection();
  if (!range) return;
  
  // Сбрасываем header и применяем стили для обычного текста
  this.quillInstance.format('header', false);
  this.quillInstance.format('bold', false); 
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

  // Сначала синхронизируем размеры всех каруселей
  this.syncCarouselSizes();
  
  // Получаем контент Quill
  const content = this.quillInstance.root.innerHTML;
  
   // Проверяем наличие blob URL в контенте
  if (content.includes('blob:')) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Внимание',
      detail: 'Пожалуйста, дождитесь загрузки всех изображений в редакторе'
    });

    // Находим все blob URL в контенте
    const blobRegex = /src=["'](blob:[^"']+)["']/g;
    const matches = content.match(blobRegex);
    
    if (matches) {
      console.warn('Обнаружены blob URL в контенте:', matches);
    }
    
    this.isSaving = false;
    return;
  }

  // Подготовка URL изображений карусели
  const carouselImageUrls = this.carouselImages
    .map(img => {
      // Получаем относительные пути
      if (img.url.includes(environment.apiUrl)) {
        // Убираем базовый URL
        const relative = img.url.replace(environment.apiUrl, '');
        // Убеждаемся, что путь начинается с /
        return relative.startsWith('/') ? relative : `/${relative}`;
      }
      return img.url;
    })
    .filter(url => url && !url.startsWith('blob:'));

  console.log('Отправляемые данные для сохранения:', {
    contentLength: content.length,
    carouselImages: carouselImageUrls,
    carouselImagesCount: carouselImageUrls.length,
    rawCarouselImages: this.carouselImages
  });

  const user = this.authService.getCurrentUser();
  const countryContent: ICountryContent = {
    _id: this.countryContent?._id,
    countryId: this.countryId,
    content: content,
    carouselImages: carouselImageUrls, // Массив относительных путей
    updatedAt: new Date(),
    updatedBy: user?.login || 'admin'
  };

  // Сначала загружаем изображения карусели
  this.uploadCarouselImages().then(() => {
    // После загрузки сохраняем контент
    this.contentService.saveContent(countryContent).subscribe({
      next: (savedContent) => {
        console.log('Контент сохранен:', savedContent);
        this.countryContent = savedContent;
        this.isEditMode = false;
        this.isSaving = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: `Контент и ${carouselImageUrls.length} изображений карусели сохранены`
        });
        
        // Переинициализируем Quill
        setTimeout(() => this.initializeQuill(), 100);
      },
      error: (error) => {
        console.error('Ошибка сохранения контента:', error);
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: error.message || 'Не удалось сохранить контент'
        });
      }
    });
  }).catch(error => {
    console.error('Ошибка загрузки изображений карусели:', error);
    this.isSaving = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить изображения карусели'
    });
  });
}

private saveContentWithCarousel(content: string): void {
  // Собираем URL-адреса изображений из карусели
  const carouselImageUrls = this.carouselImages
    .map(img => {
      // Извлекаем только относительные пути для сохранения в базе данных
      if (img.url.includes(environment.apiUrl)) {
        return this.extractRelativePath(img.url);
      }
      // Если это уже относительный путь
      else if (img.url.startsWith('/uploads/')) {
        return img.url;
      }
      // Для временных URL - возвращаем null, они должны быть уже загружены
      else if (img.url.startsWith('blob:')) {
        console.warn('Временное изображение в карусели при сохранении:', img.url);
        return null;
      }
      return img.url;
    })
    .filter(url => url !== null) as string[];

  const user = this.authService.getCurrentUser();
  const countryContent: ICountryContent = {
    _id: this.countryContent?._id,
    countryId: this.countryId,
    content: content,
    carouselImages: carouselImageUrls, // Убедитесь, что это массив строк
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
        detail: 'Контент и изображения карусели сохранены'
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

// Вспомогательный метод для извлечения относительного пути
private extractRelativePath(fullUrl: string): string | null {
  if (!fullUrl) return null;
  
  if (fullUrl.startsWith(environment.apiUrl)) {
    const path = fullUrl.replace(environment.apiUrl, '');
    // Убедитесь, что путь начинается с /
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // Если URL уже относительный, возвращаем как есть
  if (fullUrl.startsWith('/')) {
    return fullUrl;
  }
  
  // Если это просто имя файла
  if (fullUrl.includes('.') && !fullUrl.includes('://')) {
    return `/uploads/${fullUrl}`;
  }
  
  return null;
}

// Метод для очистки временных изображений в внешней карусели
private cleanupTemporaryCarouselImages(): void {
  // Удаляем все изображения из карусели, которые не были загружены на сервер
  this.carouselImages = this.carouselImages.filter(img => {
    // Если изображение временное (blob), удаляем его
    if (img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url);
      return false;
    }
    // Если изображение есть в контенте Quill, оставляем его
    // (но мы больше не добавляем изображения из Quill в карусель, так что это запасной вариант)
    return true;
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
    this.destroyQuill();

    this.carouselImages.forEach(img => {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    
    this.pendingImages.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    
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