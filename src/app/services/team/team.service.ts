import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITeam } from 'src/app/models/team';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/team`;

  constructor(private http: HttpClient) {}

  getTeamMembers(): Observable<ITeam[]> {
    return this.http.get<ITeam[]>(this.apiUrl);
  }

  getTeamMember(id: string): Observable<ITeam> {
    return this.http.get<ITeam>(`${this.apiUrl}/${id}`);
  }

  createTeamMember(team: ITeam): Observable<ITeam> {
    return this.http.post<ITeam>(this.apiUrl, team);
  }

  updateTeamMember(id: string, team: ITeam): Observable<ITeam> {
    return this.http.put<ITeam>(`${this.apiUrl}/${id}`, team);
  }

  deleteTeamMember(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData);
  }
}