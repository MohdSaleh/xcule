import './App.css';
import React, { useState, useEffect } from 'react';
import './Login.css'
import './Intro.css'
import { TVChartContainer } from './components/TVChartContainer/index';
import { TVChartContainerX } from './components/TVChartContainerX/index';
import { version } from './charting_library';
import ReactModal from 'react-modal';
import axios from 'axios';


const App = () => {

	const [login, setLogin] = useState(true)
	const [username, setUserName] = useState('xcule')
	const [password, setPassword] = useState('123123')
	const [loader, setLoader] = useState(true)
	// const [rMode, setRmode] = useState(false)

	useEffect(()=>{

	// const replayModeLocalVar = localStorage.getItem('replayMode')
	// if(replayModeLocalVar){
	// 	setRmode(true)
	// 	console.log("REPLAY MODE: ", replayModeLocalVar)
	// }else{
	// 	setRmode(false)
	// 	console.log("REPLAY MODE: ", replayModeLocalVar)
	// }

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

		console.log("BOOOOOOOOM")

		if(username.length > 0  && password.length > 0){
			const info = { username: username, password: password };
			axios.post(`${'http://localhost:8080'}/signIn/`, info)
				.then(response => {
					console.log(response.data)
					localStorage.setItem('xtoken', response.data.token)
					localStorage.setItem('userID', response.data.id)
					setLogin(false)
				}).catch((e)=>{
					alert('Something Went Wrong!')
				});
		}else{

			alert('Invalid Credentials', username, password)
		}
	}

	const introView = ()=>{
		return (
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
				<div className="wrapper" id='outPopUp'>
					<div className="card-switch">

						<div className="flip-card__inner">
							<div className="flip-card__front">
								<div className="title">WELCOME</div>


									<input className="flip-card__input" name="username" placeholder="Username" type="text" value={username} onChange={(t)=> setUserName(t.target.value)}/>
									<input className="flip-card__input" name="password" placeholder="Password" type="password" autoComplete="on" value={password} onChange={(t)=> setPassword(t.target.value)}/>
									<button className="flip-card__btn"  onClick={()=>onLoginClick()}>Let`s go!</button>

							</div>
						</div>

					</div>   
				</div>		
			</>	
			)
		}
	}

	return (
		<div className={'App'}>
			<ReactModal 
				isOpen={login}
				// contentLabel="Minimal Modal Example"
				ariaHideApp={false}
				id='loginBG'
				style={
    				{ overlay: {backgroundColor:'white'}, content: {backgroundColor:'white'}}
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
	);
}

export default App;
