import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from 'src/app/services/team/team.service';
import { ITeam } from 'src/app/models/team';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-team-edit',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})

export class TeamComponent implements OnInit {
  teamForm: FormGroup;
  isEditMode = false;
  teamId: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  directions = [
    { label: 'Слева', value: 'left' },
    { label: 'Справа', value: 'right' }
  ];

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      greeting: ['', Validators.required],
      image: ['', Validators.required],
      position: this.fb.group({
        top: ['0'],
        left: ['0']
      }),
      direction: ['left'],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.teamId;

    if (this.isEditMode && this.teamId) {
      this.loadTeamMember(this.teamId);
    }
  }

  loadTeamMember(id: string): void {
    this.teamService.getTeamMember(id).subscribe({
      next: (team) => {
        this.teamForm.patchValue(team);
        if (team.image) {
          this.imagePreview = this.getImageUrl(team.image);
        }
      },
      error: (err) => {
        console.error('Error loading team member:', err);
      }
    });
  }

  onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    
    // Установите временное значение для валидации
    this.teamForm.patchValue({ image: 'uploading...' });
    
    // Предпросмотр
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
  }

async onSubmit(): Promise<void> {
  if (this.teamForm.invalid) {
    console.log('Form invalid:', this.teamForm.errors);
    return;
  }

  let imageUrl = this.teamForm.get('image')?.value;
  
  // Если выбран новый файл - загружаем его
  if (this.selectedFile) {
    try {
      const uploadResult = await this.teamService.uploadImage(this.selectedFile).toPromise();
      imageUrl = uploadResult.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Можно показать сообщение об ошибке
      return;
    }
  } else if (!imageUrl && this.isEditMode) {
    // В режиме редактирования, если нет изображения - оставляем существующее
    imageUrl = this.imagePreview?.replace(/^data:image\/[a-z]+;base64,/, '') || '';
  }

  // Обновляем значение в форме
  if (imageUrl) {
    this.teamForm.patchValue({ image: imageUrl });
  }

  const teamData: ITeam = {
    ...this.teamForm.value,
    id: this.isEditMode ? this.teamId! : this.generateId()
  };

  // Удаляем временное значение если было
  if (teamData.image === 'uploading...') {
    teamData.image = imageUrl;
  }

  if (this.isEditMode && this.teamId) {
    this.teamService.updateTeamMember(this.teamId, teamData).subscribe({
      next: () => {
        this.router.navigate(['/main']);
      },
      error: (err) => {
        console.error('Error updating team member:', err);
      }
    });
  } else {
    this.teamService.createTeamMember(teamData).subscribe({
      next: () => {
        this.router.navigate(['/main']);
      },
      error: (err) => {
        console.error('Error creating team member:', err);
      }
    });
  }
}

  onDelete(): void {
    if (this.isEditMode && this.teamId) {
      if (confirm('Вы уверены, что хотите удалить этого участника команды?')) {
        this.teamService.deleteTeamMember(this.teamId).subscribe({
          next: () => {
            this.router.navigate(['/main']);
          },
          error: (err) => {
            console.error('Error deleting team member:', err);
          }
        });
      }
    }
  }

  private generateId(): string {
    return 'team-' + Date.now();
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${environment.apiUrl}${path}`;
    }
    return `${environment.apiUrl}/uploads/${path}`;
  }
}