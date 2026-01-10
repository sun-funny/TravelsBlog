import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

export interface QuillCarouselValue {
  images: string[];
}

export class CarouselBlot extends BlockEmbed {
  static blotName = 'carousel';
  static tagName = 'div';
  static className = 'ql-carousel';

  static create(value: QuillCarouselValue) {
    const node = super.create() as HTMLElement;
    node.setAttribute('contenteditable', 'false');
    
    // Храним как строку JSON
    node.dataset['images'] = JSON.stringify(value.images);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';
    
    const carouselId = `carousel-${Date.now()}`;
    wrapper.id = carouselId;
    
    // Создаем контейнер для индикаторов
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    // Создаем контейнер для изображений
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'carousel-images';
    
    value.images.forEach((src, index) => {
      const img = document.createElement('img');
      img.className = 'carousel-image';
      img.src = src;
      // Используем правильный синтаксис для dataset
      img.dataset['index'] = index.toString();
      img.style.display = index === 0 ? 'block' : 'none';
      imagesContainer.appendChild(img);
      
      // Индикатор
      const indicator = document.createElement('button');
      indicator.type = 'button';
      // Используем правильный синтаксис для dataset
      indicator.dataset['target'] = `#${carouselId}`;
      indicator.dataset['slideTo'] = index.toString();
      indicator.className = index === 0 ? 'active' : '';
      indicator.textContent = '•';
      indicators.appendChild(indicator);
    });
    
    // Кнопки навигации
    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.textContent = '‹';
    prev.setAttribute('data-slide', 'prev');
    
    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.textContent = '›';
    next.setAttribute('data-slide', 'next');
    
    wrapper.append(prev, imagesContainer, next, indicators);
    node.appendChild(wrapper);
    
    // Добавляем обработчики событий
    setTimeout(() => this.initializeCarousel(carouselId), 0);
    
    return node;
  }

  static initializeCarousel(carouselId: string) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const images = carousel.querySelectorAll<HTMLImageElement>('.carousel-image');
    const indicators = carousel.querySelectorAll('.carousel-indicators button');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    
    let currentIndex = 0;
    
    const showSlide = (index: number) => {
      images.forEach((img, i) => {
        img.style.display = i === index ? 'block' : 'none';
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
    
    // Используем правильный доступ к dataset
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
    const images = node.dataset['images'];
    return {
      images: images ? JSON.parse(images) : []
    };
  }
}

Quill.register(CarouselBlot);