import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageResizeToolbar {
  private toolbar: HTMLElement | null = null;
  private currentImage: HTMLElement | null = null;
  private quillInstance: any;
  private isVisible = false;
  private isEditMode = false;

  init(quill: any, isEditMode: boolean = false) {
    this.quillInstance = quill;
    this.isEditMode = isEditMode;
    
    // Уничтожаем старую панель, если она существует
    this.destroy();
    
    // Создаем панель только в режиме редактирования
    if (this.isEditMode) {
      this.createToolbar();
      this.bindEvents();
    }
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'ql-image-resize-toolbar';
    this.toolbar.style.cssText = `
      position: fixed;
      z-index: 999999;
      background: rgba(12, 38, 56, 0.98);
      border: 1px solid rgba(135, 206, 235, 0.5);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: none;
      transition: all 0.3s ease;
    `;

    const buttons = [
      { 
        title: 'Уменьшить (-10px)', 
        icon: '−', 
        action: () => this.resizeImage(-10),
        className: 'resize-btn decrease'
      },
      { 
        title: 'Стандартный размер', 
        icon: '↺', 
        action: () => this.resetImageSize(),
        className: 'resize-btn reset'
      },
      { 
        title: 'Увеличить (+10px)', 
        icon: '+', 
        action: () => this.resizeImage(10),
        className: 'resize-btn increase'
      },
      { 
        title: 'Стили изображения', 
        icon: 'S', 
        action: () => this.applyImageStyles(),
        className: 'resize-btn styles'
      }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = btn.className;
      button.title = btn.title;
      button.textContent = btn.icon;
      button.style.cssText = `
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #e0f0ff;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(135, 206, 235, 0.3)';
        button.style.borderColor = 'rgba(135, 206, 235, 0.6)';
        button.style.transform = 'translateY(-2px)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        button.style.transform = 'translateY(0)';
      });
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.action();
      });
      
      this.toolbar.appendChild(button);
    });

    // Добавляем кнопку закрытия
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.title = 'Закрыть панель';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(255, 107, 107, 0.2);
      border: 1px solid rgba(255, 107, 107, 0.3);
      border-radius: 6px;
      color: #ff6b6b;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      transition: all 0.2s ease;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 107, 107, 0.3)';
      closeBtn.style.borderColor = 'rgba(255, 107, 107, 0.5)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 107, 107, 0.2)';
      closeBtn.style.borderColor = 'rgba(255, 107, 107, 0.3)';
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });
    
    this.toolbar.appendChild(closeBtn);
    document.body.appendChild(this.toolbar);
  }

  private bindEvents(): void {
    if (!this.quillInstance || !this.isEditMode) return;

    // Клик по изображению в редакторе Quill
    this.quillInstance.root.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        this.showForImage(target);
      } else if (this.isVisible && !this.toolbar?.contains(target)) {
        this.hide();
      }
    });

    // Двойной клик по изображению
    this.quillInstance.root.addEventListener('dblclick', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        this.showForImage(target);
      }
    });

    // Обновление позиции при прокрутке
    this.quillInstance.root.addEventListener('scroll', () => {
      if (this.isVisible && this.currentImage) {
        setTimeout(() => this.updateToolbarPosition(), 10);
      }
    });

    // Обработка клавиши Escape
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Скрытие при клике вне
    document.addEventListener('click', (e: MouseEvent) => {
      if (this.isVisible && this.toolbar && 
          !this.toolbar.contains(e.target as Node) && 
          e.target !== this.currentImage) {
        this.hide();
      }
    });

    // Обновление позиции при изменении размера окна
    window.addEventListener('resize', () => {
      if (this.isVisible && this.currentImage) {
        setTimeout(() => this.updateToolbarPosition(), 10);
      }
    });
  }

  private showForImage(image: HTMLElement): void {
    if (!this.isEditMode || !this.toolbar) return;

    // Скрываем предыдущую панель
    this.hide();
    
    this.currentImage = image;
    
    // Добавляем класс выделения
    image.classList.add('ql-image-selected');
    image.style.outline = '2px solid #87ceeb';
    image.style.outlineOffset = '4px';
    image.style.boxShadow = '0 0 0 4px rgba(135, 206, 235, 0.3)';
    
    // Показываем панель
    this.toolbar.style.display = 'flex';
    this.isVisible = true;
    
    // Обновляем позицию
    this.updateToolbarPosition();
    
    // Прокручиваем к изображению
    image.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private updateToolbarPosition(): void {
    if (!this.currentImage || !this.toolbar || !this.isVisible) return;

    const imageRect = this.currentImage.getBoundingClientRect();
    const toolbarHeight = this.toolbar.offsetHeight;
    
    // Позиционируем панель над изображением с небольшим отступом
    let top = imageRect.top - toolbarHeight - 15;
    let left = imageRect.left + (imageRect.width / 2) - (this.toolbar.offsetWidth / 2);
    
    // Проверяем границы окна
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Если панель не помещается сверху, показываем снизу
    if (top < 10) {
      top = imageRect.bottom + 15;
    }
    
    // Корректируем горизонтальную позицию
    left = Math.max(10, Math.min(left, viewportWidth - this.toolbar.offsetWidth - 10));
    
    this.toolbar.style.top = `${top}px`;
    this.toolbar.style.left = `${left}px`;
  }

  private resizeImage(delta: number): void {
    if (!this.currentImage) return;

    const currentWidth = this.currentImage.offsetWidth;
    let newWidth = currentWidth + delta;
    
    // Минимальный и максимальный размер
    newWidth = Math.max(50, Math.min(newWidth, 1200));
    
    this.currentImage.style.width = `${newWidth}px`;
    this.currentImage.style.height = 'auto';
    this.currentImage.style.maxWidth = '100%';
    
    // Обновляем позицию панели
    setTimeout(() => this.updateToolbarPosition(), 50);
    
    // Сохраняем изменения в Quill
    this.saveImageChanges();
  }

  private resetImageSize(): void {
    if (!this.currentImage) return;
    
    this.currentImage.style.width = '';
    this.currentImage.style.height = '';
    this.currentImage.style.maxWidth = '';
    this.currentImage.removeAttribute('width');
    this.currentImage.removeAttribute('height');
    this.currentImage.style.float = '';
    this.currentImage.style.margin = '';
    
    setTimeout(() => this.updateToolbarPosition(), 50);
    this.saveImageChanges();
  }

  private applyImageStyles(): void {
    if (!this.currentImage || !this.toolbar) return;
    
    // Удаляем существующий диалог
    const existingDialog = document.querySelector('.ql-image-styles-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // Создаем диалог для выбора стилей
    const styles = [
      { name: '📐 Стандартный', value: '' },
      { name: '🔵 Закругленные углы', value: 'border-radius: 15px;' },
      { name: '🌟 С тенью', value: 'box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);' },
      { name: '🎨 С рамкой', value: 'border: 2px solid rgba(135, 206, 235, 0.7); padding: 4px;' },
      { name: '⬅️ Слева с текстом', value: 'float: left; margin: 0 20px 20px 0; max-width: 50%;' },
      { name: '➡️ Справа с текстом', value: 'float: right; margin: 0 0 20px 20px; max-width: 50%;' },
      { name: '📱 Адаптивный', value: 'max-width: 100%; height: auto;' },
      { name: '❌ Удалить стили', value: 'clear: both; float: none; margin: 10px auto;' }
    ];
    
    const styleDialog = document.createElement('div');
    styleDialog.className = 'ql-image-styles-dialog';
    styleDialog.style.cssText = `
      position: fixed;
      background: rgba(12, 38, 56, 0.98);
      border: 1px solid rgba(135, 206, 235, 0.5);
      border-radius: 8px;
      padding: 12px;
      z-index: 1000000;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      min-width: 220px;
      max-height: 300px;
      overflow-y: auto;
    `;
    
    styles.forEach(style => {
      const button = document.createElement('button');
      button.textContent = style.name;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px 12px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #e0f0ff;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
        font-size: 14px;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(135, 206, 235, 0.3)';
        button.style.borderColor = 'rgba(135, 206, 235, 0.6)';
        button.style.transform = 'translateX(5px)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.08)';
        button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        button.style.transform = 'translateX(0)';
      });
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.currentImage!.style.cssText = style.value;
        this.saveImageChanges();
        this.updateToolbarPosition();
        styleDialog.remove();
      });
      
      styleDialog.appendChild(button);
    });
    
    const toolbarRect = this.toolbar.getBoundingClientRect();
    styleDialog.style.top = `${toolbarRect.bottom + 10}px`;
    styleDialog.style.left = `${toolbarRect.left}px`;
    
    document.body.appendChild(styleDialog);
    
    // Закрытие при клике вне
    setTimeout(() => {
      const closeHandler = (e: MouseEvent) => {
        if (!styleDialog.contains(e.target as Node) && e.target !== this.toolbar) {
          styleDialog.remove();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 0);
  }

  private saveImageChanges(): void {
    if (this.quillInstance) {
      // Обновляем содержимое редактора
      const range = this.quillInstance.getSelection();
      if (range) {
        this.quillInstance.setSelection(range.index, 0);
      }
      
      // Имитируем изменение контента для отслеживания
      this.quillInstance.root.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  hide(): void {
    if (this.currentImage) {
      this.currentImage.classList.remove('ql-image-selected');
      this.currentImage.style.outline = '';
      this.currentImage.style.outlineOffset = '';
      this.currentImage.style.boxShadow = '';
      this.currentImage = null;
    }
    
    if (this.toolbar) {
      this.toolbar.style.display = 'none';
    }
    
    this.isVisible = false;
    
    // Удаляем диалог стилей, если он открыт
    const styleDialog = document.querySelector('.ql-image-styles-dialog');
    if (styleDialog) {
      styleDialog.remove();
    }
  }

  destroy(): void {
    this.hide();
    
    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
    
    this.toolbar = null;
    this.currentImage = null;
    this.quillInstance = null;
    this.isVisible = false;
  }
}