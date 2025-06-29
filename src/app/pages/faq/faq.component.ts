import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {
  commentForm: FormGroup;
  comments: any[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
     // this.router.navigate(['/auth']);
    }
  }

  submitComment(): void {
    if (this.commentForm.valid && this.authService.user) {
      const newComment = {
        text: this.commentForm.get('comment')?.value,
        user: this.authService.user.login,
        date: new Date()
      };
      this.comments.push(newComment);
      this.commentForm.reset();
    }
  }
}