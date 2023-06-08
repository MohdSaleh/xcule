import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import TradingView, { widget } from '../../charting_library';
import DataFeed from '../../services/DF_TV'
import axios from 'axios';
import RM from './DFcallsManager'
import './ReplayBar.scss'
import Draggable, {DraggableCore} from 'react-draggable';

function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const supportedResolutions = [
	"1S",
	"5S",
	"10S",
	"15S",
	"30S",
    "1",
    "3",
    "5",
    "15",
    "30",
    "45",
    "1H",
    "2H",
    "3H",
    "4H",
    "1D", 
    "1W",
    "1M"
  ];

export const TVChartContainer = () => {
	const chartContainerRef = useRef()
	// const tvWidgetRef = useRef()

	const [SMCLevels, setSMCLevels] = useState(null)
	const [fromRange, setFromRange] = useState(null)
	const [toRange, setToRange] = useState(null)
	// const [onReplayMode, setOnReplayMode] = useState(false)
	const [barReplay, setBarReplay] = useState(false)
	// const [replayButtonText, setReplayButtonText] = useState('⏮️ Replay')

	const [smcTfMarker, setSmcTfMarker] = useState([   
	{title: "1", val: 0},
    {title: "3", val: 0},
    {title: "5", val: 0},
    {title: "15", val: 0},
    {title: "30", val: 0},
    {title: "45", val: 0},
    {title: "1H", val: 0},
    {title: "2H", val: 0},
	{title: "3H", val: 0},
    {title: "4H", val: 0},
    {title: "1D", val: 0}, 
    {title: "1W", val: 0},
])

	const defaultProps = {
		height: window.innerHeight,
		width: window.innerWidth,
		symbol: 'BINANCE:BTCUSDT',
		interval: '15',
		datafeed: DataFeed,
		libraryPath: '/charting_library/',
		chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		clientId: 'xcule.com',
		userId: localStorage.getItem('userID'),
		fullscreen: true,
		autosize: true,
		enabled_features: ['countdown', 'study_templates', 'pre_post_market_sessions', 'tick_resolution', 'seconds_resolution', 'move_logo_to_main_pane', 'high_density_bars', 'seconds_resolution'],
		disabled_features: ['use_localstorage_for_settings', 'create_volume_indicator_by_default', 'trading_account_manager', 'order_panel', 'header_screenshot', 'dom_widget', 'show_right_widgets_panel_by_default', 'widget_logo', 'items_favoriting', 'request_only_visible_range_on_reset', 'go_to_date'],
		supported_resolutions: supportedResolutions,
		timezone: 'Asia/Kolkata',
		widgetbar: {
			details: true,
			news: false,
			watchlist: true,
			datawindow: false,
			watchlist_settings: {
				default_symbols: []
			}
		},
		overrides: {
			'mainSeriesProperties.visible': true,
			'mainSeriesProperties.showCountdown': true,
			'mainSeriesProperties.candleStyle.upColor': "#0B9981",
			'mainSeriesProperties.candleStyle.downColor': "#000000",
			'mainSeriesProperties.candleStyle.drawWick': true,
			'mainSeriesProperties.candleStyle.drawBorder': true,
			// 'mainSeriesProperties.candleStyle.borderColor': "#378658",
			'mainSeriesProperties.candleStyle.borderUpColor': "#0B9981",
			'mainSeriesProperties.candleStyle.borderDownColor': "#000000",
			// 'mainSeriesProperties.candleStyle.wickColor': "#737375",
			'mainSeriesProperties.candleStyle.wickUpColor': "#0B9981",
			'mainSeriesProperties.candleStyle.wickDownColor': "#000000",
			// 'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,
			'mainSeriesProperties.candleStyle.drawBody': true
		},
		// custom_font_family: "'monospace'"
	};


	useEffect(()=>{
		RM.ReplayMode.set('replay', false)
	},[])

	useEffect(() => {
		const widgetOptions = {
			height: window.innerHeight,
			width: window.innerWidth,
			symbol: defaultProps.symbol,
			datafeed: DataFeed,
			interval: defaultProps.interval,
			container: chartContainerRef.current,
			library_path: defaultProps.libraryPath,
			locale: getLanguageFromURL() || 'en',
			disabled_features: defaultProps.disabled_features,
			enabled_features: defaultProps.enabled_features,
			charts_storage_url: defaultProps.chartsStorageUrl,
			charts_storage_api_version: defaultProps.chartsStorageApiVersion,
			client_id: defaultProps.clientId,
			user_id: defaultProps.userId,
			fullscreen: defaultProps.fullscreen,
			autosize: defaultProps.autosize,
			studies_overrides: defaultProps.studiesOverrides,
			supported_resolutions: defaultProps.supportedResolutions,
			timezone: 'Asia/Kolkata',
			widgetbar: defaultProps.widgetbar,
			overrides: defaultProps.overrides,
			// custom_font_family: defaultProps.custom_font_family
		}; 

		var tvWidget = new widget(widgetOptions);

		tvWidget.onChartReady(() => {
			console.log(
				"CHART READY"
			) 
			tvWidget.applyOverrides({'mainSeriesProperties.showCountdown': true })
			tvWidget.applyOverrides({ 'mainSeriesProperties.sessionId': 'extended' });
			tvWidget.headerReady().then(()=>{
				console.log(
					"HEADER READY"
				)
			})

			// tvWidget.chart().onSymbolChanged()

			var dropDown1 = tvWidget.createDropdown({title: '🛗 SMC', items: smcTfMarker.map((it)=>{
						
							return {title:'➰  ' + it.title, "onSelect": ()=>  getValuesFortheChart(tvWidget, it.title)}
						
					})
			})

			var dropDown2 = tvWidget.createDropdown({title: '🔯 ICT', items: [
				{title: '♾ FVG', onSelect: ()=> getFVGValues(tvWidget)},
				{title: '♾ QML', onSelect: ()=> getQMLValues(tvWidget)}
				
			]
			})

			const buttonLogout = tvWidget.createButton();
			buttonLogout.classList.add('apply-common-tooltip');
			buttonLogout.addEventListener('click', function() { 
				tvWidget.showConfirmDialog({
					title: 'Logout?',
					body: 'Are you sure want to logout?',
					callback: (r) => {
						if(r){
							localStorage.removeItem('xtoken')
							window.location.reload(false);
						}
					},
				});
			});
			buttonLogout.innerHTML = '📴 Logout';


			let buttonReplayMode = tvWidget.createButton();
			buttonReplayMode.innerHTML = '⏮️ Replay';
			buttonReplayMode.classList.add('apply-common-tooltip');
			buttonReplayMode.addEventListener('click', async function() { 

				DataFeed.dataFeedCallBack.set('tvWidget', tvWidget)
				DataFeed.dataFeedCallBack.set('barReplayState', setBarReplay)

				setBarReplay(!barReplay)
				const onReplayMode = RM.ReplayMode.get('replay')
				RM.ReplayMode.set('replay', !onReplayMode)
				const totalBars = tvWidget.activeChart().getSeries().barsCount()
				const lastBarTime =  tvWidget.activeChart().getSeries().data().bars().last().value[0]
				const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars -2)[0]
				

						const cbReset = DataFeed.dataFeedCallBack.get('restCache')
						// const onReplayMode = RM.ReplayMode.get('replay')
						buttonReplayMode.innerHTML = 'Replay ON 🔥';
						if(!onReplayMode){
							if (tvWidget.chart().isSelectBarRequested()) return;
							const selectedBar = await tvWidget.chart().requestSelectBar()
							if(selectedBar){
								tvWidget.chart().applyOverrides({'mainSeriesProperties.showCountdown' : false, 'mainSeriesProperties.showPriceLine': false})
								const replayBarRange = (lastBarTime - selectedBar)/tfDiffer
								RM.ReplayMode.set('replay', true)
								RM.ReplayMode.set('replayStart', true)
								RM.ReplayMode.set('replayPause', true)
								RM.ReplayMode.set('replayRange', replayBarRange)
								buttonReplayMode.innerHTML = 'REPLAY ON'
								RM.ReplayMode.set('replayFrom', selectedBar)
								console.log("BAR SELECTED", selectedBar)
								cbReset()
								tvWidget.chart().resetData()
							}
						}else{
							setBarReplay(false)
							buttonReplayMode.innerHTML = '⏮️ Replay'
							DataFeed.cleanReplayStuff(true)
						}
			});

		});


		return () => {
			tvWidget.remove();
		};	
	}, []);	

	const onBarReplayWidgetClose=()=>{
		if(RM.ReplayMode.get('replay')){
			DataFeed.cleanReplayStuff(true)
		}else{
			setBarReplay(false)
		}
	}

	const getQMLValues = (tvWidget)=>{

		const {interval, symbol} = tvWidget.symbolInterval()
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		const toTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		console.log("TO CANDLE TIME: ", toTime)

		axios.get(`http://127.0.0.1:8080/getQML/?symbol=${symbol}&tf=${interval}&barCount=${totalBars}&to=${toTime}`)
                .then(function (response) {
                    // handle success
					console.log("QML VALUES", response.data)
					const qmlevels = response.data.lines.reverse()
					drawQMLevels(tvWidget, qmlevels, interval)
                })
                .catch(function (error) {
                    // handle error
                    console.log("API==>", error);
                })
	}

	const drawQMLevels=(tvWidget, qmlevels, interval)=>{
		let groupId
		const grpName = 'QML'
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		qmlevels.map((it, i)=>{
			if(it.hasOwnProperty("x1") && it.hasOwnProperty("x2")){
				if((totalBars - it.x1) > 0){
					const shapeId = tvWidget.activeChart().createMultipointShape(
						[
							{time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1},
							{time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0], price: it.y2}
						],
						{shape: 'trend_line', overrides: {"linecolor" : it.color == 0 ? '#FF5252' : '#4CAF51', "linewidth" : 2}, lock: true, disableSelection: false, showInObjectsTree: true})
						if(i == 0){
							tvWidget.chart().selection().add(shapeId)
							groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
							tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
							tvWidget.chart().selection().remove(shapeId)
						}else{
							tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
						}
				}
			}
		})
	}

	const getFVGValues = (tvWidget)=>{

		const {interval, symbol} = tvWidget.symbolInterval()
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		const toTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		console.log("TO CANDLE TIME: ", toTime)

		axios.get(`http://127.0.0.1:8080/getFVG/?symbol=${symbol}&tf=${interval}&barCount=${totalBars}&to=${toTime}`)
                .then(function (response) {
                    // handle success
					console.log("FVG VALUES", response.data)
                    const fvglevels = response.data.boxes.reverse()
					drawFVGLevels(tvWidget, fvglevels, interval)
                })
                .catch(function (error) {
                    // handle error
                    console.log("API==>", error);
                })
	}

	const drawFVGLevels=(tvWidget, fvglevels, interval)=>{
		let groupId = null
		let shapeId = null
		let textId = null
		const grpName = 'FVG'
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		const lastBarTime =  tvWidget.activeChart().getSeries().data().bars().last().value[0]
		const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars -2)[0]


		console.log("===>", tfDiffer, lastBarTime)

		fvglevels.map((it, i) => {

			if(fvglevels[i].y1 !== undefined && fvglevels[i].y2 !== undefined){

				if(it.hasOwnProperty("x1")){

					shapeId = tvWidget.activeChart().createMultipointShape(

						[
							{time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1},
							{time:it.x2 ? tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0] : tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0] + (20 * tfDiffer), price: it.y2}
						],
		
							{shape: 'rectangle', text: 'FVG', zOrder: 'bottom',
							overrides: {"backgroundColor" : fvglevels[i].bgColor == 1? '#FDE5E7' : '#D9FFEB', "linewidth" : 0, "transparency": 20, "textWrap": "none","textVAlign": "center", "fontsize": 20, "textHAlign": "right", "extend": 'none', "color": it.bgColor == 1?  '#FF0000' : '#00FF00' , "width": it?.width}, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true})

					textId = tvWidget.activeChart().createMultipointShape(

						[
							{time:tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0]+(18 * tfDiffer), price: (it.y1 - it.y2)/1.7 + it.y2 }
						],
		
							{shape: 'text', text: 'FVG', zOrder: 'top',
							overrides: {'fontsize': 7, "textColor": "#000000", 'color': it.bgColor == 1? '#FF0000' : '#0B9981', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true})
					}


					if(i == 0){
						tvWidget.chart().selection().add(shapeId)
						tvWidget.chart().selection().add(textId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						tvWidget.chart().selection().remove(shapeId)
						tvWidget.chart().selection().remove(textId)
					}else{
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
					}
			}
		})
	}


	const settingUpTfMarker = (interval, v)=>{
		var temp = smcTfMarker
		smcTfMarker.map((it, index)=>{
			if (it.title == interval.toString()) {
				temp[index].val = v
			}else{
				temp[index].val = 0
			}
			setSmcTfMarker(temp)
		})
	}

	const getValuesFortheChart=(tvWidget, intervl)=>{
		const {symbol, interval} = tvWidget.symbolInterval()	
		settingUpTfMarker(intervl? intervl : interval, 1)
		axios.get(`http://127.0.0.1:9000/history?symbol=${symbol}&tf=${intervl? intervl : interval}&depth=${5}`)
		.then((response) => {
			console.log("SMC",response.data)
			const smclevels = response.data.levels.slice(-30).reverse()
			const dzlevels = response.data.zoneD.slice(-25).reverse()
			const szlevels = response.data.zoneS.slice(-25).reverse()
			const boslevels = [...response.data.bosLL.slice(-30).reverse(), ...response.data.bosHH.slice(-30).reverse()]
			
			setSMCLevels(response.data)

			manageRangeBeforeAndDraw(tvWidget, smclevels, dzlevels, szlevels, boslevels, intervl)

			settingUpTfMarker(intervl? intervl : interval, 2)
			//METHOD ONE
		})
		.catch((err)=>{
			return err
		})
	}	

	const manageRangeBeforeAndDraw = (tvWidget, smclevels, dzlevels, szlevels, boslevels, interval)=>{
		tvWidget.activeChart().setVisibleRange(
			{ from: smclevels[smclevels.length - 1].time, to: smclevels[0].time },
		).then(() => {
			const drawMsLevelsCall = drawMsLevels(tvWidget, smclevels, interval)
			const drawDZLevelsCall = drawDZLevels(tvWidget, dzlevels, interval)
			const drawSZLevelsCall = drawSZLevels(tvWidget, szlevels, interval)
			const drawBOSLevelsCall = drawBOSLevels(tvWidget, boslevels, interval)
			console.log("ON THE FLY")
		}).finally(()=>{
			tvWidget.activeChart().restoreChart();
			console.log("EVERYTHING ALRIGHT")
		});
	}


	const drawMsLevels=(tvWidget, smclevels, interval)=>{
		let groupId
		const grpName = 'Market Structure'
		smclevels.map((it, i)=>{
			if(smclevels[i+1] !== undefined){
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[smclevels[i], smclevels[i+1]],
					{shape: 'trend_line', overrides: {"linecolor" : '#000', "linewidth" : 0.5}, lock: true, disableSelection: false, showInObjectsTree: true})
					if(i == 0){
						tvWidget.chart().selection().add(shapeId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						tvWidget.chart().selection().remove(shapeId)
					}else{
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					}
			}
		})
	}

	const drawDZLevels=(tvWidget, dzlevels, interval)=>{
		let groupId = null
		const grpName = 'Demand Zones'
		dzlevels.map((it, i)=>{
			if(dzlevels[i+1] !== undefined){
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[{time:dzlevels[i].timeA, price: dzlevels[i].priceA}, {time:dzlevels[i].timeB, price: dzlevels[i].priceB}],
					{shape: 'rectangle', zOrder: 'bottom', overrides: {"backgroundColor" : '#D9FFEB', "linewidth" : 0, "transparency": 40}, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true})
				const textId = tvWidget.activeChart().createMultipointShape(

						[
							{time:(it.timeB - it.timeA)/2 + it.timeA , price: (it.priceB - it.priceA)/2 + it.priceA}
						],
		
							{shape: 'text', text: `${interval + " " + 'DZ' }`, zOrder: 'top',
							overrides: {'fontsize': 7, "textColor": "#000000", 'color': '#0B9981', 'fixedSize': false }, lock: true, disableSelection:  i == 0 ? false : true, showInObjectsTree: true })
					if(i == 0){
						tvWidget.chart().selection().add(shapeId)
						tvWidget.chart().selection().add(textId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						// tvWidget.activeChart().sendBackward(shapeId)
						tvWidget.chart().selection().clear()
						// tvWidget.chart().selection().clear()
					}else{
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
					}
			}
		})
	}

	const drawSZLevels=(tvWidget, szlevels, interval)=>{
		let groupId
		const grpName = 'Supply Zones'
		szlevels.map((it, i)=>{
			if(szlevels[i+1] !== undefined){
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[{time:szlevels[i].timeA, price: szlevels[i].priceA}, {time:szlevels[i].timeB, price: szlevels[i].priceB}],
					{shape: 'rectangle', zOrder: 'bottom', overrides: {"backgroundColor" : '#FDE5E7', "linewidth" : 0, "transparency": 40}, lock: true, disableSelection:  i == 0 ? false : true, showInObjectsTree: true})
					const textId = tvWidget.activeChart().createMultipointShape(

						[
							{time:(it.timeB - it.timeA)/2 + it.timeA , price: (it.priceB - it.priceA)/2 + it.priceA}
						],
		
							{shape: 'text', text: `${interval + " " + 'SZ' }`, zOrder: 'top',
							overrides: {'fontsize': 7, "textColor": "#000000", 'color': '#FF0000', 'fixedSize': false }, lock: true, disableSelection:  i == 0 ? false : true, showInObjectsTree: true })
					if(i == 0){
						tvWidget.chart().selection().add(shapeId)
						tvWidget.chart().selection().add(textId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						// tvWidget.activeChart().sendBackward(shapeId)
						tvWidget.chart().selection().clear()
					}else{
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
					}
			}
		})
	}

	const drawBOSLevels=(tvWidget, boslevels, interval)=>{
		let groupId
		const grpName = 'BOS'
		boslevels.map((it, i)=>{
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[{time: boslevels[i].timeA, price: boslevels[i].price}, {time: boslevels[i].timeB, price: boslevels[i].price}],
					{shape: 'trend_line', zOrder: 'bottom', overrides: {"linecolor" : '#000', "linewidth" : 0.5, 'linestyle': 2}, lock: true, disableSelection:  i == 0 ? false : true, showInObjectsTree: true, text: "BOS"})
					const textId = tvWidget.activeChart().createMultipointShape(

						[
							{time:(it.timeB - it.timeA)/2 + it.timeA , price: it.price}
						],
		
							{shape: 'text', text: `${interval + " " + 'BOS' }`, zOrder: 'top',
							overrides: {'fontsize': 7, "textColor": "#000000", 'color': '#000000', 'fixedSize': false }, lock: true, disableSelection:  i == 0 ? false : true, showInObjectsTree: true })
					if(i == 0){
						tvWidget.chart().selection().add(shapeId)
						tvWidget.chart().selection().add(textId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						tvWidget.chart().selection().remove(shapeId)
						tvWidget.chart().selection().remove(textId)
					}else{
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
					}
		})
	}


	const getSMCValues = (depth, symbol, interval) => {
		axios.get(`http://127.0.0.1:9000/history?symbol=${symbol}&tf=${interval}&depth=${depth}`)
		.then((response) => {
			console.log("GET SMC RESPONSE", response.data)
			setSMC(response.data)
		})
		.catch((err)=>{
			return err
		})
	}

	return (
		<>
		<div
			ref={chartContainerRef}
			className={'TVChartContainer'}
		/>
		{barReplay&&<Draggable>
			<div class="positioner">
				<div class="menu">
					<div class="menu_item">
						<input class="toggle" name="menu_group2" id="sneaky_toggled" type="button" onClick={(e)=> onBarReplayWidgetClose()}/>
						<div class="expander">
							<label for="sneaky_toggled"><i class="menu_icon fa fa-close"></i></label>
						</div>
					</div>
					<div class="menu_title">
						Replay
					</div>
					<div class="menu_item">
						<input class="toggle" name="menu_group2" id="sneaky_togglea" type="radio" onClick={(e)=> RM.ReplayMode.set('replayPause', false)}/>
						<div class="expander">
							<label for="sneaky_togglea"><i class="menu_icon fa fa-play"></i> <span class="menu_text">Playing</span></label>
						</div>
					</div>
					<div class="menu_item">
						<input class="toggle" name="menu_group2" id="sneaky_toggleb" type="radio" onClick={(e)=> RM.ReplayMode.set('replayPause', true)}/>
						<div class="expander">
							<label for="sneaky_toggleb"><i class="menu_icon fa fa-pause"></i> <span class="menu_text">Pause</span></label>
						</div>
					</div>
					<div class="menu_item">
						<input class="toggle" name="menu_group2" id="sneaky_togglec" type="radio"/>
						<div class="expander">
							<label for="sneaky_togglec"><i class="menu_icon fa fa-stop"></i></label>
						</div>
					</div>
				</div>
			</div>
		</Draggable>}
		</>
	);
}

