import Quill from 'quill';

// Карусель блот
const BlockEmbed = Quill.import('blots/block/embed');

export interface QuillCarouselValue {
  images: string[];
  alignment?: string;  // Добавляем выравнивание
  width?: string;      // Ширина карусели
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
    
    // Сохраняем все данные
    node.setAttribute('data-images', JSON.stringify(value.images));
    node.setAttribute('data-alignment', value.alignment || 'center');
    node.setAttribute('data-width', value.width || '100%');
    
    // Применяем выравнивание и размер
    this.applyStyles(node, value);
    
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
    
    // Кнопка настроек
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
    prev.style.cssText = `
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 50;
  opacity: 0.8;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    opacity: 1;
  }
`;

    
    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Следующий слайд');
    
    next.style.cssText = `
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 50;
  opacity: 0.8;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    opacity: 1;
  }
`;

    wrapper.append(controls, prev, imagesContainer, next, indicators);
    node.appendChild(wrapper);

    wrapper.style.cssText = `
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
`;

imagesContainer.style.cssText = `
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
`;
    
    // Добавляем обработчики событий
    setTimeout(() => this.initializeCarousel(carouselId), 0);
    
    return node;
  }

  static applyStyles(node: HTMLElement, value: QuillCarouselValue) {
    // Применяем выравнивание
    switch (value.alignment) {
      case 'left':
        node.style.marginRight = 'auto';
        node.style.marginLeft = '0';
        break;
      case 'right':
        node.style.marginLeft = 'auto';
        node.style.marginRight = '0';
        break;
      case 'center':
      default:
        node.style.marginLeft = 'auto';
        node.style.marginRight = 'auto';
        break;
    }
    
    // Применяем ширину
    if (value.width) {
      node.style.width = value.width;
      node.style.maxWidth = '100%';
    }
    
    // Для resize handler
    node.style.position = 'relative';
    node.style.display = 'inline-block';
    node.style.verticalAlign = 'middle';
  }

  static initializeCarousel(carouselId: string) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const carouselWrapper = carousel.closest('.ql-carousel') as HTMLElement;
    const controls = carousel.querySelector('.carousel-controls') as HTMLElement;
    const deleteBtn = carousel.querySelector('.carousel-delete-btn') as HTMLButtonElement;
    const settingsBtn = carousel.querySelector('.carousel-settings-btn') as HTMLButtonElement;
    
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
              quillInstance.update();
            }
          }
        }
      });
    }
    
    // Обработчик настроек (выравнивание)
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.openAlignmentMenu(carouselWrapper);
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
    
    // Инициализация resize
    this.initializeResize(carouselWrapper);
  }

static openAlignmentMenu(carouselElement: HTMLElement) {
  // Удаляем существующее меню, если есть
  const existingMenu = carouselElement.querySelector('.carousel-alignment-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Создаем меню выравнивания
  const menu = document.createElement('div');
  menu.className = 'carousel-alignment-menu';
  menu.style.cssText = `
    position: absolute;
    top: 40px;
    right: 0;
    background: rgba(12, 38, 56, 0.98);
    border: 1px solid rgba(135, 206, 235, 0.35);
    border-radius: 8px;
    padding: 8px;
    z-index: 1000;
    min-width: 140px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  `;
  
  const options = [
    { 
      value: 'left', 
      icon: '◀', 
      label: 'По левому краю',
      // Более понятные иконки
      // альтернативные варианты:
      // icon: '↖', // или '◀', или '←'
      // icon: '▌', // символ левого выравнивания
      iconStyle: 'transform: rotate(90deg); display: inline-block;'
    },
    { 
      value: 'center', 
      icon: '●', 
      label: 'По центру',
      // альтернативы:
      // icon: '◎', '⊙', '◉'
      iconStyle: ''
    },
    { 
      value: 'right', 
      icon: '▶', 
      label: 'По правому краю',
      // альтернативы:
      // icon: '↗', '▐', '→'
      iconStyle: 'transform: rotate(90deg); display: inline-block;'
    }
  ];
  
  const currentAlignment = carouselElement.getAttribute('data-alignment') || 'center';
  
  // Добавляем заголовок меню
  const menuTitle = document.createElement('div');
  menuTitle.textContent = 'Выравнивание:';
  menuTitle.style.cssText = `
    color: #87ceeb;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(135, 206, 235, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  menu.appendChild(menuTitle);
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `alignment-option ${currentAlignment === option.value ? 'selected' : ''}`;
    
    // Создаем контейнер для содержимого кнопки
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      width: 100%;
    `;
    
    // Иконка с улучшенной видимостью
    const iconSpan = document.createElement('span');
    iconSpan.textContent = option.icon;
    iconSpan.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      font-size: 16px;
      color: ${currentAlignment === option.value ? '#87ceeb' : '#e0f0ff'};
      ${option.iconStyle}
      text-shadow: ${currentAlignment === option.value ? '0 0 8px rgba(135, 206, 235, 0.7)' : 'none'};
      transition: all 0.2s ease;
    `;
    
    // Текст
    const textSpan = document.createElement('span');
    textSpan.textContent = option.label;
    textSpan.style.cssText = `
      color: ${currentAlignment === option.value ? '#87ceeb' : '#e0f0ff'};
      font-size: 13px;
      font-weight: ${currentAlignment === option.value ? '500' : '400'};
      flex: 1;
      text-align: left;
    `;
    
    // Индикатор выбранного варианта
    const checkSpan = document.createElement('span');
    if (currentAlignment === option.value) {
      checkSpan.textContent = '✓';
      checkSpan.style.cssText = `
        color: #87ceeb;
        font-weight: bold;
        font-size: 14px;
      `;
    }
    
    content.appendChild(iconSpan);
    content.appendChild(textSpan);
    content.appendChild(checkSpan);
    button.appendChild(content);
    
    // Стили кнопки
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px 12px;
      background: ${currentAlignment === option.value ? 'rgba(135, 206, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
      border: ${currentAlignment === option.value ? '1px solid rgba(135, 206, 235, 0.4)' : '1px solid transparent'};
      color: #e0f0ff;
      text-align: left;
      border-radius: 6px;
      cursor: pointer;
      margin: 4px 0;
      transition: all 0.2s ease;
      font-family: 'Montserrat', Helvetica, sans-serif;
    `;
    
    // Эффекты при наведении
    button.addEventListener('mouseenter', () => {
      if (currentAlignment !== option.value) {
        button.style.background = 'rgba(135, 206, 235, 0.15)';
        button.style.borderColor = 'rgba(135, 206, 235, 0.3)';
        iconSpan.style.color = '#87ceeb';
        iconSpan.style.textShadow = '0 0 6px rgba(135, 206, 235, 0.5)';
        textSpan.style.color = '#87ceeb';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      if (currentAlignment !== option.value) {
        button.style.background = 'rgba(255, 255, 255, 0.05)';
        button.style.borderColor = 'transparent';
        iconSpan.style.color = '#e0f0ff';
        iconSpan.style.textShadow = 'none';
        textSpan.style.color = '#e0f0ff';
      }
    });
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Обновляем атрибут
      carouselElement.setAttribute('data-alignment', option.value);
      
      // Применяем стили выравнивания
      switch (option.value) {
        case 'left':
          carouselElement.style.marginRight = 'auto';
          carouselElement.style.marginLeft = '0';
          carouselElement.style.float = 'left';
          carouselElement.style.clear = 'left';
          break;
        case 'right':
          carouselElement.style.marginLeft = 'auto';
          carouselElement.style.marginRight = '0';
          carouselElement.style.float = 'right';
          carouselElement.style.clear = 'right';
          break;
        case 'center':
        default:
          carouselElement.style.marginLeft = 'auto';
          carouselElement.style.marginRight = 'auto';
          carouselElement.style.float = 'none';
          carouselElement.style.clear = 'both';
          break;
      }
      
      // Удаляем меню
      menu.remove();
      
      // Показываем уведомление (опционально)
      setTimeout(() => {
        // Можно добавить небольшую анимацию изменения
        carouselElement.style.transform = 'scale(1.02)';
        setTimeout(() => {
          carouselElement.style.transform = 'scale(1)';
        }, 200);
      }, 0);
    });
    
    menu.appendChild(button);
  });
  
  carouselElement.appendChild(menu);
  
  // Закрытие меню при клике вне его
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && 
        e.target !== carouselElement.querySelector('.carousel-settings-btn') &&
        !(e.target as Element).closest('.carousel-settings-btn')) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', escapeHandler);
  }, 0);
}

  static initializeResize(carouselElement: HTMLElement) {
    // Создаем resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'carousel-resize-handle';
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 15px;
      height: 15px;
      background: rgba(135, 206, 235, 0.7);
      border-radius: 2px;
      cursor: se-resize;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    carouselElement.appendChild(resizeHandle);
    
    // Показываем handle при наведении
    carouselElement.addEventListener('mouseenter', () => {
      resizeHandle.style.opacity = '1';
    });
    
    carouselElement.addEventListener('mouseleave', () => {
      resizeHandle.style.opacity = '0';
    });
    
    // Реализация изменения размера
    let isResizing = false;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startWidth = carouselElement.offsetWidth;
      startHeight = carouselElement.offsetHeight;
      startX = e.clientX;
      startY = e.clientY;
      
      e.preventDefault();
      e.stopPropagation();
    });
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Изменяем ширину пропорционально
      const newWidth = Math.max(200, startWidth + deltaX); // Минимальная ширина 200px
      carouselElement.style.width = `${newWidth}px`;
      
      // Обновляем атрибут
      carouselElement.setAttribute('data-width', `${newWidth}px`);
    };
    
    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    resizeHandle.addEventListener('mousedown', () => {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  static value(node: HTMLElement): QuillCarouselValue {
    const imagesAttr = node.getAttribute('data-images');
    const alignment = node.getAttribute('data-alignment');
    const width = node.getAttribute('data-width');
    
    return {
      images: imagesAttr ? JSON.parse(imagesAttr) : [],
      alignment: alignment || 'center',
      width: width || '100%'
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