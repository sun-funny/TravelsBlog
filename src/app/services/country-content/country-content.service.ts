import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ICountryContent } from 'src/app/models/country-content';

@Injectable({
  providedIn: 'root'
})
export class CountryContentService {
  private apiUrl = `${environment.apiUrl}/country-content`;
  private uploadUrl = `${environment.apiUrl}/country-content/uploads`;

  constructor(private http: HttpClient) {}

  getContent(countryId: string): Observable<ICountryContent> {
  return this.http.get<ICountryContent>(`${this.apiUrl}/${countryId}`).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 404) {
        const emptyContent: ICountryContent = {
          countryId: countryId,
          content: '',
          carouselImages: []
        };
        return of(emptyContent);
      }
      return throwError(() => this.handleError(error));
    })
  );
}

  saveContent(content: ICountryContent): Observable<ICountryContent> {
    const hasContentId = content._id || content.content?.trim().length > 0;
    
    if (hasContentId) {
      return this.http.put<ICountryContent>(
        `${this.apiUrl}/${content.countryId}`, 
        this.prepareContentForSave(content),
        { 
          headers: this.getAuthHeaders()
        }
      ).pipe(
        catchError(this.handleError)
      );
    } else {
      return this.http.post<ICountryContent>(
        this.apiUrl, 
        this.prepareContentForSave(content),
        { 
          headers: this.getAuthHeaders()
        }
      ).pipe(
        catchError(this.handleError)
      );
    }
  }

  uploadImage(formData: FormData): Observable<{url: string}> {
  return this.http.post<{url: string}>(
    `${this.apiUrl}/upload`, // Изменено с this.uploadUrl на this.apiUrl
    formData,
    { 
      headers: this.getAuthHeaders(false)
    }
  ).pipe(
    catchError(this.handleError)
  );
}
  createContent(content: ICountryContent): Observable<ICountryContent> {
    return this.http.post<ICountryContent>(
      this.apiUrl, 
      this.prepareContentForSave(content),
      { 
        headers: this.getAuthHeaders()
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  public deleteImage(imagePath: string): Observable<any> {
    // Вариант 1: Используем getAuthHeaders()
    const headers = this.getAuthHeaders();
    
    return this.http.delete(`${environment.apiUrl}/api/images`, {
      body: { imagePath },
      headers: headers
    }).pipe(
      catchError(this.handleError)
    );
}

  // Вспомогательные методы

  private prepareContentForSave(content: ICountryContent): any {
  const cleanContent = content.content?.trim() || '';
  
  // Очищаем HTML: удаляем пустые параграфы и лишние пробелы
  let processedContent = cleanContent
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!processedContent || processedContent === '<p></p>') {
    processedContent = '';
  }

  // ВОТ ИСПРАВЛЕНИЕ: добавляем carouselImages в данные для сохранения
  return {
    countryId: content.countryId,
    content: processedContent,
    carouselImages: content.carouselImages || [], // Добавляем массив изображений карусели
    updatedBy: content.updatedBy
  };
}

  private getAuthHeaders(isJson: boolean = true): { [header: string]: string } {
    const token = localStorage.getItem('token');
    const headers: { [header: string]: string } = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Произошла ошибка';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Ошибка: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Нет соединения с сервером';
          break;
        case 401:
          errorMessage = 'Неавторизованный доступ. Войдите в систему';
          break;
        case 403:
          errorMessage = 'Доступ запрещен';
          break;
        case 404:
          if (error.url?.includes('upload')) {
            errorMessage = 'Эндпоинт загрузки не найден';
          } else {
            errorMessage = 'Контент не найден';
          }
          break;
        case 413:
          errorMessage = 'Файл слишком большой (макс. 10MB)';
          break;
        case 415:
          errorMessage = 'Неподдерживаемый тип файла';
          break;
        case 500:
          errorMessage = 'Ошибка сервера';
          break;
        default:
          errorMessage = `Ошибка ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    console.error('CountryContentService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}