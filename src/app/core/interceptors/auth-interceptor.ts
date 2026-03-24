import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly apiBaseUrl = 'http://localhost:8080/api';

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = localStorage.getItem('gastro_token');

        const isApiCall = req.url.startsWith(this.apiBaseUrl);
        const isAuthCall = req.url.startsWith(`${this.apiBaseUrl}/auth/`);

        if (!token || !isApiCall || isAuthCall) {
            return next.handle(req);
        }

        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });

        return next.handle(authReq);
    }
}
