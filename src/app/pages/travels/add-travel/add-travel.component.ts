import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITravel } from 'src/app/models/travel';
import { TravelService } from 'src/app/services/travel/travel.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-travel',
  templateUrl: './add-travel.component.html',
  styleUrls: ['./add-travel.component.scss']
})
export class AddTravelComponent {
  travelForm: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    public router: Router
  ) {
    this.createForm();
  }

  createForm() {
    this.travelForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      short_description: ['', Validators.required],
      description: ['', Validators.required],
      flag: ['', Validators.required],
      img: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]],
      featured: [false],
      top: [''],
      left: ['']
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.travelForm.valid) {
      const newTravel: ITravel = {
        id: this.generateId(),
        ...this.travelForm.value
      };
      
      this.travelService.createTravel(newTravel).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Путешествие добавлено'
          });
          this.router.navigate(['/travels']);
        },
        error: (err) => {
          console.error('Ошибка при добавлении:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось добавить путешествие'
          });
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}