import Quill from 'quill';

// Карусель блот
const BlockEmbed = Quill.import('blots/block/embed');

export interface QuillCarouselValue {
  images: string[];
}

class CarouselBlot extends BlockEmbed {
  static blotName = 'carousel';
  static tagName = 'div';
  static className = 'ql-carousel';

  static create(value: QuillCarouselValue) {
    console.log('Creating carousel with value:', value);
    
    const node = super.create() as HTMLElement;
    node.setAttribute('contenteditable', 'false');
    node.classList.add('ql-carousel');
    node.setAttribute('data-images', JSON.stringify(value.images));
    
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';
    
    const carouselId = `carousel-${Date.now()}`;
    wrapper.id = carouselId;
    
    // Создаем контейнер для управления каруселью
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 100;
      display: flex;
      gap: 5px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Кнопка удаления карусели
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'carousel-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Удалить карусель';
    deleteBtn.style.cssText = `
      background: rgba(220, 53, 69, 0.9);
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    
    // Кнопка настроек (можно добавить позже)
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'carousel-settings-btn';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.title = 'Настройки карусели';
    settingsBtn.style.cssText = `
      background: rgba(135, 206, 235, 0.9);
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    
    controls.appendChild(settingsBtn);
    controls.appendChild(deleteBtn);
    
    // Создаем контейнер для индикаторов
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    // Создаем контейнер для изображений
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'carousel-images';
    
    value.images.forEach((src, idx) => {
      // Создаем изображение
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'carousel-slide';
      imgWrapper.style.display = idx === 0 ? 'block' : 'none';
      
      const img = document.createElement('img');
      img.className = 'carousel-image';
      img.src = src;
      img.alt = `Изображение ${idx + 1}`;
      img.setAttribute('data-index', idx.toString());
      
      imgWrapper.appendChild(img);
      imagesContainer.appendChild(imgWrapper);
      
      // Индикатор
      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.className = `carousel-indicator ${idx === 0 ? 'active' : ''}`;
      indicator.setAttribute('data-index', idx.toString());
      indicator.setAttribute('aria-label', `Перейти к слайду ${idx + 1}`);
      indicator.innerHTML = '•';
      indicators.appendChild(indicator);
    });
    
    // Кнопки навигации
    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.textContent = '‹';
    prev.setAttribute('aria-label', 'Предыдущий слайд');
    
    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Следующий слайд');
    
    wrapper.append(controls, prev, imagesContainer, next, indicators);
    node.appendChild(wrapper);
    
    // Добавляем обработчики событий
    setTimeout(() => this.initializeCarousel(carouselId), 0);
    
    return node;
  }

  static initializeCarousel(carouselId: string) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const carouselWrapper = carousel.closest('.ql-carousel') as HTMLElement;
    const controls = carousel.querySelector('.carousel-controls') as HTMLElement;
    const deleteBtn = carousel.querySelector('.carousel-delete-btn') as HTMLButtonElement;
    
    // Показываем кнопки управления при наведении
    if (carouselWrapper && controls) {
      carouselWrapper.addEventListener('mouseenter', () => {
        controls.style.opacity = '1';
      });
      
      carouselWrapper.addEventListener('mouseleave', () => {
        controls.style.opacity = '0';
      });
    }
    
    // Обработчик удаления карусели
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (carouselWrapper && confirm('Удалить эту карусель?')) {
          // Находим Quill редактор
          const quillEditor = carouselWrapper.closest('.ql-container')?.parentElement;
          if (quillEditor) {
            // Удаляем карусель из DOM
            carouselWrapper.remove();
            
            // Если нужно обновить состояние Quill
            const quillInstance = (window as any).currentQuillInstance;
            if (quillInstance) {
              // Можно обновить контент Quill
              quillInstance.update();
            }
          }
        }
      });
    }
    
    // Остальная логика инициализации карусели
    const images = carousel.querySelectorAll<HTMLDivElement>('.carousel-slide');
    const indicators = carousel.querySelectorAll<HTMLButtonElement>('.carousel-indicator');
    const prevBtn = carousel.querySelector<HTMLButtonElement>('.carousel-btn.prev');
    const nextBtn = carousel.querySelector<HTMLButtonElement>('.carousel-btn.next');
    
    let currentIndex = 0;
    
    const showSlide = (index: number) => {
      images.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
      
      indicators.forEach((indicator, i) => {
        if (i === index) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
      
      currentIndex = index;
    };
    
    if (images.length > 0) {
      showSlide(0);
    }
    
    prevBtn?.addEventListener('click', () => {
      const newIndex = (currentIndex - 1 + images.length) % images.length;
      showSlide(newIndex);
    });
    
    nextBtn?.addEventListener('click', () => {
      const newIndex = (currentIndex + 1) % images.length;
      showSlide(newIndex);
    });
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showSlide(index));
    });
  }

  static value(node: HTMLElement): QuillCarouselValue {
    const imagesAttr = node.getAttribute('data-images');
    return {
      images: imagesAttr ? JSON.parse(imagesAttr) : []
    };
  }
}

// Регистрируем все кастомные блоки
export function registerCustomBlots() {
  console.log('Registering custom blots...');
  
  try {
    Quill.register(CarouselBlot, true);
    console.log('CarouselBlot registered successfully');
  } catch (error) {
    console.error('Error registering CarouselBlot:', error);
  }
}

export { CarouselBlot };
