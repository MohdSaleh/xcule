import './App.css';
import React, { useState, useEffect } from 'react';
// import './Login.css'
import './Login.scss'
import './Intro.css'
import { TVChartContainer } from './components/TVChartContainer/index';
import { version } from './charting_library';
import ReactModal from 'react-modal';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function togglePasswordVisibility() {
	const passwordInput = document.getElementById('password');
	const togglePassword = document.querySelector('.toggle-password');
	
	if (passwordInput.type === 'password') {
	  passwordInput.type = 'text';
	  togglePassword.style.backgroundImage = "url('eye.png')";
	} else {
	  passwordInput.type = 'password';
	  togglePassword.style.backgroundImage = "url('view.png')";
	}
  }


const App = () => {

	const [login, setLogin] = useState(true)
	const [username, setUserName] = useState('')
	const [password, setPassword] = useState('')
	const [loader, setLoader] = useState(true)
	// const [rMode, setRmode] = useState(false)

	useEffect(()=>{

	const value = localStorage.getItem('xtoken')
	if(value){
		setLogin(false)
	}else{
		setLogin(true)
	}
	setTimeout(()=>{
		setLoader(false)
	}, 3000)

	}, [])


	const onLoginClick = ()=>{
		let toastID = toast.loading('Loggin in...')
		if(username.length > 0  && password.length > 0){
			const info = { username: username, password: password };
			axios.post('https://tvd.xcule.com/signIn/', info)
				.then(response => {
					// console.log(response.data)
					localStorage.setItem('xtoken', response.data.token)
					localStorage.setItem('userID', response.data.id)
					localStorage.setItem('userName', response.data.username)
					setLogin(false)
					toast.update(toastID, { render: "Success", type: "success", isLoading: false, autoClose: 2000, icon: "✅" });
				}).catch((e)=>{
					console.log(e)
					toast.update(toastID, { render: "Something went wrong!", type: "error", isLoading: false, autoClose: 2000, icon: "❌" });	
				})
		}else {
				toast.update(toastID, { render: "Invalid Username or Password!", type: "error", isLoading: false, autoClose: 2000, icon: "❌" });					
		}
	}

	const introView = ()=>{
		return (
			<div id='intro-body'>
				<svg xmlnsXlink="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 800 400">


				<symbol id="s-text">
				<text textAnchor="middle"
						x="50%" y="50%" dy=".35em">
					XCULE
				</text>
				</symbol>


				<use  xlinkHref="#s-text" className="text"
						></use>
				<use xlinkHref="#s-text" className="text"
						></use>
				<use xlinkHref="#s-text" className="text"
						></use>
				<use xlinkHref="#s-text" className="text"
						></use>
				<use xlinkHref="#s-text" className="text"
						></use>

				</svg>
			</div>
		)
	}

	const loginModal = ()=> {
		if(loader){
			return(
				introView()
			)
		}else{
			return (
			<>
				<div className="login-container login">
					<div className="logo">
					<img className="login-logo" src="logo.png" alt="Logo" />
					</div>
					<div className="login-form">
					<h2>Sign in with email</h2>
					<div className="login-form-group">
						<label for="email">Email or Username:</label>
						<input type="text" id="email" name="email" value={username} onChange={(t)=> setUserName(t.target.value)} />
					</div>
					<div className="login-form-group">
						<label for="password">Password:</label>
						<div className="password-input">
						<input type="password" id="password" name="password" value={password} onChange={(t)=> setPassword(t.target.value)}/>
						<span className="toggle-password" onClick={()=>togglePasswordVisibility()}></span>
						</div>
					</div>
					<div className="login-form-group remember">
						<input type="checkbox" id="rememberMe" name="rememberMe" />
						<label for="rememberMe">Remember me</label>
					</div>
					<button className="login-btn" onClick={()=>onLoginClick()}>Let`s go!</button>
					</div>
				</div>
			</>	
			)
		}
	}

	return (
		<>
		<div className={'App'}>
			<ReactModal 
				isOpen={login}
				// contentLabel="Minimal Modal Example"
				ariaHideApp={true}
				fullscreen={true}
				// id='loginBG'
				style={
    				{ overlay: {backgroundColor:'white'}, content: {backgroundColor:'white', border: '0px'}}
				}>

				{loginModal()}

			</ReactModal>

			{!login&&<>
				<TVChartContainer />
			</>}
			<div id="my-div">
				<button data-text="Awesome" className="button">
					<span className="actual-text">&nbsp;XC&nbsp;&nbsp;&nbsp;&nbsp;</span>
					<span className="hover-text" aria-hidden="true">&nbsp;xcule&nbsp;</span>
				</button>
			</div>
		</div>

		<ToastContainer
			position="top-right"
			autoClose={3000}
			hideProgressBar={false}
			newestOnTop={false}
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable
			pauseOnHover={false}
			theme="light"
			/>
		</>
	);
}

export default App;
