import { Component, OnInit } from '@angular/core';
import { Comment } from 'src/app/models/comment';
import { CommentsService } from 'src/app/services/comments/comments.service';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  providers: [ConfirmationService]
})
export class CommentsComponent implements OnInit {
  comments: Comment[] = [];
  newCommentText: string = '';
  isAdmin = false;

  constructor(
    private commentsService: CommentsService,
    private messageService: MessageService,
    public authService: AuthService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadComments();
    this.authService.userBehavior$.subscribe(user => {
      this.isAdmin = user?.login === 'admin';
    });
  }

  loadComments(): void {
    this.commentsService.getComments().subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось загрузить комментарии'
        });
      }
    });
  }

  addComment(): void {
  if (!this.newCommentText.trim()) return;

  if (!this.authService.isAuthenticated) {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Необходимо авторизоваться'
    });
    return;
  }

  const newComment: Partial<Comment> = {
    text: this.newCommentText,
    userId: this.authService.getUserId(),
    userName: this.authService.getUserName(),
    date: new Date()
  };

  this.commentsService.addComment(newComment).subscribe({
    next: (comment) => {
      this.newCommentText = '';
      this.comments.unshift(comment);
      this.messageService.add({
        severity: 'success',
        summary: 'Успех',
        detail: 'Комментарий добавлен'
      });
    },
    error: (err) => {
      console.error('Error adding comment:', err);
      if (err.status === 401) {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Сессия истекла. Пожалуйста, войдите снова.'
        });
        this.authService.logout();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось добавить комментарий'
        });
      }
    }
  });
}
confirmDeleteComment(commentId: string): void {
    this.confirmationService.confirm({
      message: 'Вы уверены, что хотите удалить этот комментарий?',
      header: 'Подтверждение удаления',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Да',
      rejectLabel: 'Нет',
      accept: () => {
        this.deleteComment(commentId);
      }
    });
  }

  confirmDeleteAllComments(): void {
    this.confirmationService.confirm({
      message: 'Вы уверены, что хотите удалить ВСЕ комментарии?',
      header: 'Подтверждение удаления',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Да',
      rejectLabel: 'Нет',
      accept: () => {
        this.deleteAllComments();
      }
    });
  }
  private deleteComment(commentId: string): void {
    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c._id !== commentId);
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Комментарий удален'
        });
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить комментарий'
        });
      }
    });
  }
private deleteAllComments(): void {
    this.commentsService.deleteAllComments().subscribe({
      next: (response) => {
        this.comments = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: response.message || 'Все комментарии удалены'
        });
      },
      error: (err) => {
        console.error('Error deleting all comments:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось удалить комментарии'
        });
      }
    });
  }
}
