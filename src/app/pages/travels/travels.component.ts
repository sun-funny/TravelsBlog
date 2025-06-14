import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ITravel } from 'src/app/models/travel';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-travels',
  templateUrl: './travels.component.html',
  styleUrls: ['./travels.component.scss']
})
export class TravelsComponent implements OnInit {
  travels: ITravel[] = [];
  loading = true;
  error = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchTravels();
  }

  fetchTravels(): void {
  this.http.get<any>(`${environment.apiUrl}/travels`).subscribe({
    next: (data) => {
      if (data && data.travels) {
        this.travels = data.travels;
      } else {
        console.warn('Unexpected data format:', data);
        this.error = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching main:', err);
      this.error = true;
      this.loading = false;
      setTimeout(() => this.fetchTravels(), 5000);
    }
  });
}

  get filteredTravels(): ITravel[] {
    return this.travels.filter(item => item.year === 2025);
  }
}
