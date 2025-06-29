import { Component, OnInit } from '@angular/core';
import { Comment } from 'src/app/models/comment';
import { CommentsService } from 'src/app/services/comments/comments.service';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss']
})
export class CommentsComponent implements OnInit {
  comments: Comment[] = [];
  newCommentText: string = '';

  constructor(
    private commentsService: CommentsService,
    private messageService: MessageService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadComments();
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

  const newComment: Partial<Comment> = {
    text: this.newCommentText,
    userId: this.authService.getUserId(),
    userName: this.authService.getUserName(),
    date: new Date() // Add current date
  };

  this.commentsService.addComment(newComment).subscribe({
    next: () => {
      this.newCommentText = '';
      this.loadComments();
      this.messageService.add({
        severity: 'success',
        summary: 'Успех',
        detail: 'Комментарий добавлен'
      });
    },
    error: (err) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось добавить комментарий'
      });
    }
  });
}
}
