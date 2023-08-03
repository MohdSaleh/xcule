import React from 'react';

export default function Login(){ React.createClass({
    render: function() {
      return (
        <div>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Login Page</title>
          {/* <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet"> */}
          <style dangerouslySetInnerHTML={{__html: "\n    @font-face {\n      font-family: 'trebuc';\n      src: url('fonts/trebuc.ttf') format('truetype');\n      /* Additional font formats for compatibility */\n      /* src: url('fonts/your-font-file.woff') format('woff'),\n            url('fonts/your-font-file.woff2') format('woff2'); */\n    }\n  " }} />
          <link rel="stylesheet" href="styles.css" />
          <div className="container login">
            <div className="logo">
              <img className="login-logo" src="logo.png" alt="Logo" />
            </div>
            <form className="login-form">
              <h2>Sign in with email</h2>
              <div className="form-group">
                <label htmlFor="email">Email or Username:</label>
                <input type="text" id="email" name="email" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <div className="password-input">
                  <input type="password" id="password" name="password" />
                  <span className="toggle-password" onclick="togglePasswordVisibility()" />
                </div>
              </div>
              <div className="form-group remember">
                <input type="checkbox" id="rememberMe" name="rememberMe" />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <button type="submit" className="btn">Sign In</button>
            </form>
          </div>
        </div>
      );
    }
  })};