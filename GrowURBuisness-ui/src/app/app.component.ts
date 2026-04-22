import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'GrowURBuisnessUI';
  
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  loginMessage: string = '';
  isLoggedIn: boolean = false;
  
  constructor() {
    console.log('AppComponent initialized');
  }
  
  ngOnInit() {
    // Check if user is already logged in
    this.checkLoginStatus();
  }
  
  checkLoginStatus() {
    const loginState = localStorage.getItem('isLoggedIn');
    this.isLoggedIn = loginState === 'true';
  }
  
  onLogin() {
    this.isLoading = true;
    this.loginMessage = '';
    
    // Simulate login API call
    setTimeout(() => {
      this.isLoading = false;
      
      // Simple validation
      if (!this.email || !this.password) {
        this.loginMessage = 'Please enter email and password';
        return;
      }
      
      // Demo credentials check
      if (this.email === 'demo@company.com' && this.password === 'demo123') {
        this.loginMessage = 'Login successful!';
        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', this.email);
        this.isLoggedIn = true;
        
        // Clear form
        this.email = '';
        this.password = '';
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        this.loginMessage = 'Invalid credentials. Use demo@company.com / demo123';
      }
    }, 1500);
  }
  
  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    this.isLoggedIn = false;
  }
}
