import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import TradingView, { widget } from '../../charting_library';
import DataFeed from '../../services/DF_TV'
import axios from 'axios';
import RM from './DFcallsManager'
import './ReplayBar.scss'
import Draggable, { DraggableCore } from 'react-draggable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

let buttonReplayMode

const supportedResolutions = [
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

	const [SMCLevels, setSMCLevels] = useState(null)
	const [valueDepth, setValueDepth] = useState('5')
	const [barReplay, setBarReplay] = useState(false)
	const [widgetLoaded, setWidgetLoaded] = useState()


	const [smcTfMarker, setSmcTfMarker] = useState([
		{ title: "1", val: 0 },
		{ title: "3", val: 0 },
		{ title: "5", val: 0 },
		{ title: "15", val: 0 },
		{ title: "30", val: 0 },
		{ title: "45", val: 0 },
		{ title: "1H", val: 0 },
		{ title: "2H", val: 0 },
		{ title: "3H", val: 0 },
		{ title: "4H", val: 0 },
		{ title: "1D", val: 0 },
		{ title: "1W", val: 0 },
	])

	const defaultProps = {
		height: window.innerHeight,
		width: window.innerWidth,
		symbol: 'BINANCE:BTCUSDT',
		interval: '15',
		datafeed: DataFeed,
		libraryPath: '/charting_library/',
		chartsStorageUrl: 'https://saveload.xcule.com',
		chartsStorageApiVersion: '1.1',
		clientId: 'xcule.com',
		userId: `${localStorage.getItem('userID')}`,
		fullscreen: true,
		autosize: true,
		enabled_features: ['countdown', 'study_templates', 'pre_post_market_sessions', 'tick_resolution', 'seconds_resolution', 'move_logo_to_main_pane', 'high_density_bars', 'seconds_resolution', 'use_localstorage_for_settings', 'chart_template_storage'],
		disabled_features: ['create_volume_indicator_by_default', 'trading_account_manager', 'order_panel', 'dom_widget', 'show_right_widgets_panel_by_default', 'border_around_the_chart', 'widget_logo', 'request_only_visible_range_on_reset', 'go_to_date', 'iframe_loading_compatibility_mode'],
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
			'mainSeriesProperties.candleStyle.borderUpColor': "#0B9981",
			'mainSeriesProperties.candleStyle.borderDownColor': "#000000",
			'mainSeriesProperties.candleStyle.wickUpColor': "#0B9981",
			'mainSeriesProperties.candleStyle.wickDownColor': "#000000",
			'mainSeriesProperties.candleStyle.drawBody': true
		},
		custom_css_url: '/custom/css/base.css'
	};

	useEffect(() => {
		RM.ReplayMode.set('replay', false)
	}, [])

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
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			widgetbar: defaultProps.widgetbar,
			overrides: defaultProps.overrides,
			auto_save_delay: 5,
			load_last_chart: true,
			custom_css_url: defaultProps.custom_css_url,
			loading_screen: {
				backgroundColor: "#FFFFFF",
				foregroundColor: "transparent"
			}
		};

		var tvWidget = new widget(widgetOptions);
		setWidgetLoaded(tvWidget)

		tvWidget.onChartReady((e) => {
			// console.log(
			// 	"CHART READY"
			// )
			let { interval, symbol } = tvWidget.symbolInterval()

			tvWidget.subscribe('onAutoSaveNeeded', () => {
				// console.log(
				// 	"AUTO SAVE"
				// )
				tvWidget.saveChartToServer()
			})

			tvWidget.applyOverrides({ 'mainSeriesProperties.showCountdown': true })
			tvWidget.applyOverrides({ 'mainSeriesProperties.sessionId': 'extended' });
			tvWidget.headerReady().then(() => {
				// console.log(
				// 	"HEADER READY"
				// )
			})

			let smcDown = tvWidget.createDropdown({
				icon: x_smc_icn,
				title: 'SMC',
				tooltip: 'Smart Money Concept',
				items: smcTfMarker.map((it) => {
					return { 
						title: '👀  ' + it.title, 
						"onSelect": () => getValuesFortheChart(tvWidget, it.title) 
					}
				})
			})

			let ictDown = tvWidget.createDropdown({
				title: 'ICT',
				tooltip: 'Inner Circle Trader',
				icon: `
						<?xml version="1.0" encoding="UTF-8" standalone="no"?>
						<svg
							xmlns:dc="http://purl.org/dc/elements/1.1/"
							xmlns:cc="http://creativecommons.org/ns#"
							xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
							xmlns:svg="http://www.w3.org/2000/svg"
							xmlns="http://www.w3.org/2000/svg"
							xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
							xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
							version="1.0"
							width="25px"
							height="28px"
							viewBox="0 0 52.500002 52.5"
							preserveAspectRatio="xMidYMid meet"
							id="svg74"
							sodipodi:docname="ict.svg"
							inkscape:version="0.92.5 (2060ec1f9f, 2020-04-08)">
							<metadata
								id="metadata80">
								<rdf:RDF>
									<cc:Work
										rdf:about="">
										<dc:format>image/svg+xml</dc:format>
										<dc:type
											rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
										<dc:title></dc:title>
									</cc:Work>
								</rdf:RDF>
							</metadata>
							<defs
								id="defs78" />
							<sodipodi:namedview
								pagecolor="#ffffff"
								bordercolor="#666666"
								borderopacity="1"
								objecttolerance="10"
								gridtolerance="10"
								guidetolerance="10"
								inkscape:pageopacity="0"
								inkscape:pageshadow="2"
								inkscape:window-width="1366"
								inkscape:window-height="683"
								id="namedview76"
								showgrid="false"
								units="px"
								inkscape:zoom="4.9875"
								inkscape:cx="50.688315"
								inkscape:cy="24.823794"
								inkscape:window-x="0"
								inkscape:window-y="27"
								inkscape:window-maximized="1"
								inkscape:current-layer="svg74" />
							<g
								transform="matrix(0.01619194,0,0,-0.01619194,-25.271686,55.230188)"
								id="g72"
								style="fill:#000000;stroke:none">
								<path
									d="m 3196,3043 c -6,-14 -5,-15 5,-6 7,7 10,15 7,18 -3,3 -9,-2 -12,-12 z"
									id="path2"
									inkscape:connector-curvature="0" />
								<path
									d="m 2884,3025 c -471,-125 -835,-522 -919,-1002 -19,-110 -19,-316 0,-427 88,-507 470,-905 975,-1017 118,-26 149,-25 85,4 -79,34 -120,63 -174,123 -218,238 -143,619 147,757 35,16 85,32 110,35 l 47,5 -22,-25 c -39,-42 -48,-82 -26,-125 10,-20 28,-43 41,-51 22,-15 23,-14 17,10 -5,19 -1,31 16,47 19,17 21,23 9,34 -10,9 -12,9 -6,0 4,-8 1,-13 -8,-13 -33,0 -48,71 -21,106 14,18 14,17 15,-13 0,-33 15,-52 23,-31 3,7 6,-1 6,-18 1,-16 6,-35 13,-42 9,-9 9,-12 0,-12 -7,0 -12,-7 -12,-16 0,-8 -4,-12 -10,-9 -5,3 -7,0 -4,-8 6,-16 44,-11 44,5 0,5 -4,6 -10,3 -5,-3 -10,-1 -10,5 0,6 8,10 18,8 12,-2 17,-13 17,-36 0,-37 2,-38 31,-14 28,23 44,54 44,89 0,32 -34,93 -52,93 -9,0 -9,-3 0,-12 18,-18 15,-53 -7,-79 -16,-20 -20,-21 -32,-9 -8,8 -15,26 -16,40 -1,14 1,19 4,12 8,-19 33,5 33,32 -1,18 -2,19 -13,6 -15,-19 -49,-19 -55,-1 -3,8 0,11 7,7 6,-4 11,-1 11,8 0,12 -10,16 -35,16 -58,0 -185,30 -257,59 -190,80 -352,244 -426,431 -39,99 -52,174 -52,289 0,140 18,216 80,346 88,183 217,301 415,382 95,39 83,41 -41,8 z"
									id="path4"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,3028 c 0,-13 -4,-28 -10,-34 -5,-5 -7,-19 -3,-32 4,-18 8,-20 19,-11 16,13 19,85 4,94 -6,3 -10,-4 -10,-17 z"
									id="path6"
									inkscape:connector-curvature="0" />
								<path
									d="m 3360,3032 c 58,-40 91,-77 117,-130 38,-79 39,-183 0,-257 -36,-69 -77,-111 -139,-140 -74,-35 -86,-32 -48,12 29,32 32,41 27,81 -3,27 -13,52 -27,66 l -21,21 6,-35 c 5,-27 2,-42 -13,-60 -17,-21 -21,-22 -33,-10 -21,22 -23,64 -4,56 21,-8 31,21 17,45 -7,10 -12,26 -12,34 0,8 -3,15 -7,15 -5,0 -9,11 -9,24 -1,16 3,23 15,22 11,-1 16,7 16,27 -1,32 10,35 26,6 11,-21 9,-46 -6,-83 -8,-17 -6,-17 23,-2 106,55 133,199 53,285 -34,36 -60,43 -37,9 9,-12 16,-41 16,-64 0,-49 -34,-98 -76,-108 -20,-5 -23,-10 -14,-21 12,-15 -3,-31 -20,-20 -5,3 -10,1 -10,-5 0,-6 -4,-8 -10,-5 -5,3 -10,15 -10,25 0,10 -15,28 -33,39 -56,34 -72,94 -41,153 21,41 -1,33 -40,-15 -40,-50 -48,-134 -17,-194 20,-40 56,-72 94,-86 15,-6 16,-4 7,13 -15,28 -12,76 5,90 13,11 15,8 15,-18 0,-32 15,-51 23,-30 3,7 6,0 6,-15 1,-17 -3,-26 -9,-22 -7,4 -8,-3 -4,-22 9,-37 14,-42 14,-12 1,23 1,23 15,5 21,-27 19,-43 -6,-49 -14,-4 -22,1 -28,15 -7,19 -8,19 -14,4 -4,-10 -2,-27 4,-38 9,-17 13,-18 20,-7 6,10 9,6 9,-14 0,-19 -4,-26 -12,-21 -8,5 -9,2 -5,-9 10,-25 -20,-21 -34,4 -6,12 -9,37 -7,55 5,39 -4,43 -24,12 -35,-54 -26,-122 20,-159 l 27,-21 -35,7 c -117,24 -208,135 -218,266 -7,98 17,159 89,231 31,32 53,58 47,58 -22,0 -128,-64 -166,-100 -97,-93 -142,-192 -150,-326 -4,-75 -1,-105 17,-162 42,-138 147,-254 278,-307 84,-33 108,-33 65,1 -57,45 -81,122 -61,196 14,54 76,118 114,118 21,0 26,-4 21,-16 -3,-8 -1,-25 6,-37 11,-21 11,-21 19,-2 6,16 8,13 8,-13 1,-23 -3,-31 -11,-26 -8,5 -9,2 -5,-9 8,-22 -7,-22 -28,0 -12,11 -16,28 -13,55 4,44 -5,48 -28,13 -33,-50 -17,-128 32,-160 23,-15 23,-14 18,14 -5,23 -2,32 15,40 14,8 21,8 21,1 0,-5 -5,-10 -12,-10 -18,0 0,-13 22,-17 11,-2 20,2 20,7 0,6 -5,10 -11,10 -5,0 -8,4 -4,10 3,5 13,6 21,3 12,-4 15,-15 11,-39 -5,-30 -4,-33 11,-25 39,21 57,53 57,102 0,37 -5,54 -22,71 l -22,22 5,-35 c 4,-25 1,-41 -14,-59 -17,-21 -21,-22 -34,-10 -19,20 -18,61 2,57 10,-1 15,6 15,25 -1,23 3,27 25,24 42,-5 68,-24 95,-70 48,-82 26,-197 -47,-246 l -33,-22 35,6 c 118,20 264,138 321,260 100,214 26,480 -169,604 -54,36 -158,76 -112,44 z m -145,-461 c -3,-6 4,-15 15,-21 24,-13 27,-58 5,-66 -10,-4 -13,-14 -9,-29 5,-19 2,-22 -20,-22 -16,0 -26,5 -26,14 0,8 5,11 10,8 6,-4 10,6 9,22 0,15 -3,22 -6,15 -4,-10 -8,-10 -19,-1 -20,16 -18,32 9,62 21,25 45,37 32,18 z"
									id="path8"
									inkscape:connector-curvature="0" />
								<path
									d="m 3201,2547 c -1,-12 -6,-16 -13,-11 -7,4 -10,3 -5,-1 12,-13 47,-16 47,-4 0,5 -4,8 -9,4 -5,-3 -12,3 -14,12 -4,17 -5,17 -6,0 z"
									id="path10"
									inkscape:connector-curvature="0" />
								<path
									d="m 3485,3020 c 299,-121 485,-374 502,-685 22,-401 -252,-744 -651,-814 -33,-6 -61,-13 -63,-15 -2,-2 19,-6 46,-10 137,-18 280,-143 342,-298 33,-81 37,-217 11,-305 -42,-136 -129,-238 -257,-299 -77,-37 -66,-42 42,-20 350,75 638,276 826,578 227,364 246,833 51,1223 -166,329 -481,577 -840,660 -89,21 -90,19 -9,-15 z"
									id="path12"
									inkscape:connector-curvature="0" />
								<path
									d="m 3147,3034 c -14,-14 -7,-61 12,-78 17,-16 19,-16 24,6 4,12 2,25 -3,28 -5,3 -13,16 -17,28 -5,13 -12,20 -16,16 z"
									id="path14"
									inkscape:connector-curvature="0" />
								<path
									d="m 3170,2888 c 0,-16 5,-28 10,-28 13,0 13,20 0,40 -8,12 -10,9 -10,-12 z"
									id="path16"
									inkscape:connector-curvature="0" />
								<path
									d="m 3231,2886 c -8,-10 -9,-16 -1,-21 5,-3 13,1 16,10 9,22 -1,29 -15,11 z"
									id="path18"
									inkscape:connector-curvature="0" />
								<path
									d="m 3201,2863 c -1,-6 -4,-20 -7,-30 -5,-17 -5,-17 6,0 6,10 9,23 6,30 -3,9 -5,9 -5,0 z"
									id="path20"
									inkscape:connector-curvature="0" />
								<path
									d="m 3144,2196 c -7,-28 9,-76 25,-76 17,0 17,35 -1,69 l -17,34 z"
									id="path22"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,2196 c 0,-13 -5,-26 -11,-28 -7,-2 -9,-13 -4,-26 5,-19 9,-21 21,-11 16,13 19,75 4,84 -6,3 -10,-5 -10,-19 z"
									id="path24"
									inkscape:connector-curvature="0" />
								<path
									d="m 3188,2106 c -23,-17 -25,-81 -3,-72 11,4 15,-2 15,-20 0,-14 -4,-22 -10,-19 -5,3 -10,-2 -10,-11 0,-16 -2,-15 -21,2 -17,15 -20,27 -16,62 4,41 4,42 -14,26 -28,-26 -42,-76 -29,-110 20,-52 80,-102 65,-54 -4,12 -1,27 5,35 15,17 30,20 30,4 0,-5 -5,-7 -11,-3 -7,4 -10,1 -7,-6 5,-15 48,-22 48,-8 0,4 -5,8 -12,8 -9,0 -9,3 -1,11 18,18 35,-1 31,-32 -3,-18 0,-29 7,-29 19,0 54,44 61,77 8,39 -12,100 -36,113 -17,9 -17,7 -7,-21 9,-24 9,-35 -3,-56 -18,-31 -40,-41 -40,-18 0,9 -4,14 -9,11 -5,-3 -8,6 -8,19 0,18 4,25 16,23 21,-4 23,54 1,59 -12,4 -13,3 -1,-5 17,-12 4,-35 -15,-28 -8,3 -14,1 -14,-5 0,-6 -4,-7 -10,-4 -5,3 -10,13 -10,21 0,8 4,13 9,10 5,-3 11,3 14,14 3,11 4,20 4,20 -1,0 -10,-7 -19,-14 z"
									id="path26"
									inkscape:connector-curvature="0" />
								<path
									d="m 3060,2063 c -50,-33 -92,-79 -118,-128 -21,-41 -26,-64 -26,-125 0,-90 23,-149 81,-207 32,-32 117,-83 138,-83 2,0 -7,16 -20,36 -14,20 -25,47 -25,59 0,42 23,87 52,105 l 30,18 -44,20 c -110,48 -139,193 -57,287 33,38 29,45 -11,18 z"
									id="path28"
									inkscape:connector-curvature="0" />
								<path
									d="m 3332,2060 c 54,-42 74,-142 44,-213 -16,-38 -61,-82 -98,-96 l -27,-10 35,-35 c 45,-45 48,-108 7,-157 l -27,-32 25,8 c 189,59 271,287 160,450 -30,44 -104,105 -128,105 -11,0 -8,-6 9,-20 z"
									id="path30"
									inkscape:connector-curvature="0" />
								<path
									d="m 3148,1844 c -15,-14 -8,-61 11,-78 17,-16 19,-16 24,3 3,11 -1,25 -8,31 -8,6 -15,21 -17,32 -2,11 -6,16 -10,12 z"
									id="path32"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,1832 c 0,-10 -5,-23 -11,-29 -6,-6 -8,-21 -4,-33 5,-17 10,-19 21,-9 16,13 19,89 4,89 -5,0 -10,-8 -10,-18 z"
									id="path34"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,1700 c 0,-15 -4,-30 -10,-36 -5,-5 -7,-19 -3,-32 4,-18 8,-20 19,-11 16,13 18,67 4,89 -8,12 -10,10 -10,-10 z"
									id="path36"
									inkscape:connector-curvature="0" />
								<path
									d="m 3146,1694 c -11,-28 -7,-50 13,-68 17,-16 19,-16 23,1 2,10 -4,33 -13,51 -13,25 -18,29 -23,16 z"
									id="path38"
									inkscape:connector-curvature="0" />
								<path
									d="m 3171,1558 c -1,-15 4,-30 9,-33 12,-7 12,12 0,40 -8,18 -9,17 -9,-7 z"
									id="path40"
									inkscape:connector-curvature="0" />
								<path
									d="m 3232,1557 c -6,-7 -7,-18 -3,-26 7,-10 10,-8 16,8 8,27 2,36 -13,18 z"
									id="path42"
									inkscape:connector-curvature="0" />
								<path
									d="m 3220,1500 c 0,-13 11,-13 30,0 12,8 11,10 -7,10 -13,0 -23,-4 -23,-10 z"
									id="path44"
									inkscape:connector-curvature="0" />
								<path
									d="m 3049,1461 c -161,-101 -182,-333 -42,-462 64,-59 163,-97 112,-43 -19,20 -24,36 -24,76 0,46 3,53 41,87 46,40 60,74 38,92 -8,6 -14,18 -14,26 0,8 -4,11 -10,8 -15,-9 -12,-48 6,-73 32,-45 -48,-12 -90,38 -66,79 -53,192 29,262 32,28 3,21 -46,-11 z"
									id="path46"
									inkscape:connector-curvature="0" />
								<path
									d="m 3342,1452 c 44,-49 52,-74 46,-147 -5,-65 -38,-113 -97,-142 l -40,-20 29,-21 c 51,-38 58,-125 14,-173 -26,-29 2,-24 64,11 60,35 115,104 133,168 16,58 7,167 -19,218 -26,50 -75,100 -127,126 l -40,21 z"
									id="path48"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,1236 c 0,-14 -4,-28 -10,-31 -12,-8 -12,-16 0,-35 9,-13 11,-13 20,0 13,20 13,77 0,85 -6,3 -10,-5 -10,-19 z"
									id="path50"
									inkscape:connector-curvature="0" />
								<path
									d="m 3146,1097 c -9,-29 6,-77 23,-77 15,0 20,39 6,50 -8,6 -16,21 -18,33 -3,20 -4,19 -11,-6 z"
									id="path52"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,1096 c 0,-14 -4,-28 -10,-31 -12,-8 -12,-16 0,-35 9,-13 11,-13 20,0 13,20 13,77 0,85 -6,3 -10,-5 -10,-19 z"
									id="path54"
									inkscape:connector-curvature="0" />
								<path
									d="m 3170,958 c 0,-16 5,-28 10,-28 13,0 13,20 0,40 -8,12 -10,9 -10,-12 z"
									id="path56"
									inkscape:connector-curvature="0" />
								<path
									d="m 3232,963 c -8,-14 -9,-24 -2,-28 12,-7 24,18 18,37 -3,8 -9,5 -16,-9 z"
									id="path58"
									inkscape:connector-curvature="0" />
								<path
									d="m 3086,863 c -75,-69 -75,-195 0,-264 31,-28 91,-53 67,-28 -18,19 -16,74 4,90 14,12 16,12 11,-1 -3,-8 -1,-23 4,-34 8,-15 12,-16 19,-5 6,10 9,4 9,-19 0,-22 -4,-31 -11,-26 -7,4 -10,1 -7,-6 6,-18 48,-20 48,-3 0,8 -4,12 -9,9 -5,-3 -8,5 -7,19 0,16 6,24 16,22 10,-1 15,7 15,26 -1,34 12,35 27,1 9,-19 9,-33 1,-55 -14,-35 -7,-36 38,-6 43,29 79,92 79,140 0,63 -37,134 -84,159 -18,10 -18,9 -2,-13 21,-31 21,-108 -2,-135 -9,-12 -31,-29 -49,-38 -23,-11 -30,-21 -26,-35 4,-15 -1,-18 -21,-18 -16,0 -26,5 -26,14 0,8 5,11 10,8 6,-3 10,-2 10,3 0,5 -13,15 -29,22 -68,28 -98,100 -67,161 21,42 17,44 -18,12 z"
									id="path60"
									inkscape:connector-curvature="0" />
								<path
									d="m 3146,867 c -9,-29 6,-77 23,-77 15,0 20,39 6,50 -8,6 -16,21 -18,33 -3,20 -4,19 -11,-6 z"
									id="path62"
									inkscape:connector-curvature="0" />
								<path
									d="m 3250,868 c 0,-13 -5,-29 -10,-34 -6,-6 -8,-18 -4,-28 5,-13 9,-14 20,-5 16,13 19,75 4,84 -6,3 -10,-4 -10,-17 z"
									id="path64"
									inkscape:connector-curvature="0" />
								<path
									d="m 3170,733 c 0,-12 5,-25 10,-28 13,-8 13,15 0,35 -8,12 -10,11 -10,-7 z"
									id="path66"
									inkscape:connector-curvature="0" />
								<path
									d="m 3238,744 c -5,-4 -8,-16 -8,-28 0,-14 3,-17 11,-9 6,6 9,19 7,28 -1,9 -6,13 -10,9 z"
									id="path68"
									inkscape:connector-curvature="0" />
								<path
									d="m 3201,704 c 0,-11 3,-14 6,-6 3,7 2,16 -1,19 -3,4 -6,-2 -5,-13 z"
									id="path70"
									inkscape:connector-curvature="0" />
							</g>
						</svg>
				
				`,
				items: [
					{ title: '♾ FVG', onSelect: () => getFVGValues(tvWidget) },
					{ title: '♾ QML', onSelect: () => getQMLValues(tvWidget) },
					{ title: '♾ DFXT', onSelect: () => getDFXTValues(tvWidget) }
				]
			})

			buttonReplayMode = tvWidget.createButton();
			buttonReplayMode.setAttribute('id', 'navbar-replay-button');
			buttonReplayMode.innerHTML = `<span  class="navbar-replay-icon-container"><img class="replay-icon" src="/assets/replay.svg">Replay</span>`;
			buttonReplayMode.addEventListener('click', async function () {

				if (tvWidget.chart().isSelectBarRequested()) {
					tvWidget.chart().cancelSelectBar()
				}
				console.log("BEFORE REPLAY MODE", barReplay)
				setBarReplay(!barReplay)
				buttonReplayMode.innerHTML = `<span class="navbar-replay-icon-container active"><img class="replay-icon" src="/assets/replay_active.svg">Replay</span>`
				DataFeed.dataFeedCallBack.set('tvWidget', tvWidget)
				DataFeed.dataFeedCallBack.set('barReplayState', setBarReplay)
				let onReplayMode = RM.ReplayMode.get('replay')
				RM.ReplayMode.set('replay', !onReplayMode)
				let totalBars = tvWidget.activeChart().getSeries().barsCount()
				let lastBarTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
				let tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - 2)[0]
				let cbReset = DataFeed.dataFeedCallBack.get('restCache')

				if (!onReplayMode) {
					if (tvWidget.chart().isSelectBarRequested()) {
						tvWidget.chart().cancelSelectBar()
					};
					console.log("AFTER REPLAY MODE", barReplay)
					startOverlayListener()
					
					try {
						let selectedBar = await tvWidget.chart().requestSelectBar()
						if (selectedBar) {
							document.getElementById('replayActionButtonMenuContainer').classList.remove('hide')
							// document.getElementsByTagName("body")[0].style.cursor = "auto";
							tvWidget.chart().applyOverrides({ 'mainSeriesProperties.showCountdown': false, 'mainSeriesProperties.showPriceLine': false, 'scalesProperties.showTimeScaleCrosshairLabel': true })
							let replayBarRange = (lastBarTime - selectedBar) / tfDiffer
							RM.ReplayMode.set('replay', true)
							RM.ReplayMode.set('replayStart', true)
							RM.ReplayMode.set('replayPause', true)
							RM.ReplayMode.set('replayRange', replayBarRange)
							RM.ReplayMode.set('replayFrom', selectedBar)
							cbReset()
							tvWidget.chart().resetData()
						}
					} catch (e) {
						console.log("ERROR")
					}
				} else {
					if (tvWidget.chart().isSelectBarRequested()) {
						tvWidget.chart().cancelSelectBar()
					}
					setBarReplay(false)
					buttonReplayMode.innerHTML = `<span class="navbar-replay-icon-container"><img class="replay-icon" src="/assets/replay.svg">Replay</span>`;
					DataFeed.cleanReplayStuff(true)
				}
			});

			
			let profileDrop = tvWidget.createDropdown({
				align:'right',
				icon: `<?xml version="1.0" encoding="UTF-8"?>
				<svg width=102 height="24px" viewBox="0 0 175 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					<title>Artboard</title>
					<g id="Artboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
						<image id="user-profile-2871145-2384395" x="20" y="0" width="36" height="36" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCCAYAAAB8GMlFAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABwqADAAQAAAABAAABwgAAAADHyZ8pAABAAElEQVR4Aey9DZzl6VXXeW/dqurql5nume55TyYZAgk7YUFJEAKuEGCNQSEYmAY1Hz/wUYirZAUEdfezmp5FEAFFZUFRV1ddUHswERIjBCExGiAaeVszoDEvTBImzGRee3q6q+pW3f19f+ec/33u7eokU909maSfp+r/f85z3p/zrzrnPv+3Oxr11iPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CPQI9Aj0CNwBSMwvoK6u+oegasyArPZjP8r/2/do/6ueRRmAtk+VgvZe0IHzPfeNZq9VrLj8fjjkf9Y+ju9R6BHoEegR6BH4PJEgKKnbUXbhP7yaP3YWrB1+vRscips9w+0HztknaNH4KIR6P9AFw1NJ/QILEZAxYf/l9pYne0ucjA6tXL6l199/OjGkZsmo51bjkzGxyfj2fPGK6vHdsbj6yaj0XGt6Q7u7s5WxbyGxO5sNpJudePtnd3p1vZ094nd8fgBgWd3drY/tDWafeD8ZOWBnc0z9//nd/+nB3/gj//xs8gtNwojuLvuGkm8rxyX49PHPQIXi0AvhBeLTMf3CCgCWfxY6V1Q+F546l3rf/0rb7j9umOHX7C2OnrRoQNrL1CZvENLwzvWVteuH0/G6xsHRqN1yp3+03Z1UnOm0kk53d1BtzYUCweNAbjdLK/wbE1Ho83N0ejcufO70+2ts1vT6YdV7t63dfbse8+Ndn79/NYTv/bB84//9+982Rc9IA0LjcJ4772j2alTexXsBdY+6BG4qiPQC+FVffj75PeKwMWK36m3vOvI/3Tzsz/7pmvWf8+BAyufuzqZ3Kmy9bxrD68eW18fjViOqXa5eO0I2NkdzVZWsv5RACl2qnYqejqdCpxFD1j/icjEglOsyZ8Fc0UyK/yzjrWTThfLLRXIRx59fDTd3blve7r17u3t87925vy5d35k8+x//F+/4sXvQVu1XhQrEr3vEbgwAr0QXhiTjrlKI6AC6Gt87SnPf/i2+2944bOv/aKjGwdetrY2e+n66srzjh1dWVXdG2mxNtrWtjNVXXJ9o1DNxlnoxhQzCpxXfip+GrnkZT3Mld9YSGH0Kzn3XhWCTJlhhajCal27XJYczVQ4KagTCqNXnCqkZx4/Pzp79rFHz22f+5Unz59/85mds29+9S+98VdHp07lOnM0oij206eKWW89AhmBXgj7n8JVHYFa/an4eT1GMP72m9597Uv+x9v+52vWV195YLLypUePTm4+rCt6FL0tVmqqfSpfuqjn4sbFuHGWORUmipRrGEXKRdABTlhdDBMwD5iGt5VzPdyNaupCKU4VRnTz42IqvJwZUxhZSa6wURy35PDDD/3O7nkVxfNb59/wxOaTb/ymP/Si/xweREHsp04rGr2/miPQC+HVfPSv4rnvVQDf+p6zn3fDobWvO3Jg5WuOHZs895D+O3T2cbSt1Z4K3a6WfSs6P+n/mR0KGZvOVboi6QqiToVGi7o1L245psC5qTeY/TK+LYQwDrzAHrOjFMsxrRKlk9UnhTkKowqnxvLXq9UJp1M57frQR+7fPbf95NvObp/9sfc98eGfOvXKlw3XFU+dmq30a4l5fHp31UXA/9RX3az7hK/aCCwXwO/92fccfdn/8OyvPnpo/PUb6ytfduLwyhpLQy2mWGjtquBxbc63YGrV6ErkqhirQccxilMUoQps4fgHM0y5ysaYNvQeGDXghgK4zBcr0kWdUkQR5KZW7j1FL0WQnuI82xnvslrUKdxVVoq68UbXFh/8wLmtsz/58OYj/+zP/KEv/IWwzirx9OTkyZPD6rjwve8R+FSOQC+En8pHt89tiMByAfzRd/72iReduP4brj+8+uobT0w+nWt+57WpdujSn64VqtDp15VPtYTh8L/iooNmik/TaxXGSVIjAYOozkwgAh6GCZQO080FYwDLsuZpaIOsAHgZUwl1qlTFkXOm+pUzXh3qhK5uvqEowjgB9zsPfGDniSfP/PRj0zN/+8985Re8OfTPxnffPRr3FSLR6O1qiMDwz301TLbP8eqMgAqDTg/GNcDTv3z/Dc8/cexPXXNo7dW3HJ/cxj+AVn87XkbphsyoY3m6U8WPgsbjDhQZGkWQxrhwbW9y8QSrGP2bu0Amy6CjdJaI+5IzMSiDrcRZTypb9olzpSxc6QGrIGZRZIWoRzJ2V1npPvLwA6PHzj7y849Pz3z/n/qDv+enrV43D6kg6j6b/vhFRL/vP1UjwP99bz0Cn5IRUHFbUZL34uzUG9556Cs/585XX3dw7dtvPbH6LBZFIkx5wsFLPxUDVlA0nfr0lUAXFo3BekuArgpiW+TA06yGQf13CTYtGVrY/OyqFS/j5B9ILa2hp9u2W7oHnCYZuDx92l5LVBB2tErUClEFURc5dRr4kUcfGD3y+EM/85GtR7/nW1/xRW/DDKdL77rrrv6Qfh2I3n/KRaD+VT/lJtYndPVGQAWQv2uKoK91/cf3nnvV8SOTv3DLDWufRVWkAGqdpNOf4xXXFlUARHQ20Xd6UsAWiqArieQQznZBIRS+io9ZUia7QC0MQlGLuphc4c3Ljtml4IADlTj4C7afxeuiqLmq3+XuVhG5hqjTpWMVRO461ctseDZjtPLggx8anTn3+I8/sPXwd3/HV/++e9HZrx8Shd4+FSPQC+Gn4lG9iud0WqdBT2YBfPP/9+iLbzu+8X233nTgpQd5nKAK4GjMNUDle1UIlozqqBWuc20RrAKS9Cou7osmucK3Yb8AlzoGnuVxEizXFDrQ4OofNc0Gdw4KVzYtLqTxDY/p4IeNu07jBps4XRoFcTod7Wxv7U6kZ/zb97//7KNPPPSDv3DsXd/9/7z0G89zd+lrX6uPEP0VbnnEevepEIH6//pUmEufw1UcgXYV+CX/6C0bP/iln3/3dYfXv13XAVf1CATP/VEAePpB5z21GCKTqyCoDrgwtKvAWu25YCim9LTlvsWZoeGp8V48F8NRuVjLaoEaRaxVYqEGnz5dbHWY7BYoVuvPgeeGHQG5QuRaIqtCrxCnWiFub+tdAVs7q3pjzej++9//roemT/z5P/vVX/AmdPfVIVHo7VMlAr0Qfqocyat4Hu21wDf/+iNf/KzjB3/4ObceeKGe/1Plm011/lNvP1P9U9pn1ccdoNQDb2CBtaueUNYpRXC0fRXB1Bka5nt0hTdzHFDZWMDiAP+l6Uh2Ma7/3mVaKrAdRAehOVy4Ot1bBXFnaYU4nY51/VC1cbqz+vDDHx498OiDP/wrm+/+iz9y8uQT/dphBrp3n/QRqH+lT/qJ9AlcnRF4y1tmqy996XjKzTBf9Vl3/uXrr137jhuvX51wGnR1pLtFWQEqy/M6NMoPNYFVIM0XEIUAR2GoHprHILJV4WC4DDd1ytyD2ACEzMWK3174NDvYWrZR9NZgYy7IDWIABRhORM3F89WnBAqiTxXrUiHvjWOFqGI49unSzZ2V6XR7/KH73/eujzz56J/71q/9wp/BUH8YP8Ld95+8EeiF8JP32F3Vnith87erKjfe/efv+ODzP/tZx3/subduvDgK3mxnZTSeKOMrrSuxwyVmEryvAwJroxZUUfAKkLEQbNUWYJBF36MywWtDsMGXSuqfbEFX8ra4CwXmOlLVYlcGwDb+tOhBIJF0ZhVgVIPP5bLxLogK0q5OkWZBVDHU6dIt1UatDrmZ5iNnHvwr3/yKF/8lbPRTpUOkO/BJGIH6H/0kdL27fLVG4JQeiziVj0X8u3c9/Edvuu7wDz/rlvVjyunbuv63qvde+z5QSqXqpYb0vlDokFWRanuyPzWhLUwDDM3VIyJufI6RcQNoeMAN8mZY3F1AK0XoULuAHmgREli2JfQSas6LSBLLTVBWpV2pBMBu2aYAUhx9R62uH2pVqIuG4/G2bqbZOj9d2do6P77vQ+/+mfs2H/uGUydf+uG3vOUtWp2/ND6LYKC3HoFPkgjkv90nibfdzas+Au1dob/0Xx//q8+57Zq/eOiwrgVy9nM8VhEksSuVs1Q0rLH+ygdYERR6SPjAVQmGItAUDcgDveCkm5a7Kh6FWx4viNpoCaZ66bTallbK1KOvzFYPGZhmezUI1HyPzqJ9FP0IlN/08427SzX2i719unSsM6SzrS09k7+1tXrfh97zod/ZfOTrv+OVv/c/zHRX6ei1/a7SefA79MkQgfr3+GTwtft4lUegiuCp1//Ksa/67M/48U977uGXKyS7ehpQX/c+1vfhKnerEuoZOV8LJOezcRqUZpgdsHq2ggMIngWcCfNdyZin0Mt6Cq/e/PyXJU9DGsBWp/nEv4AT554q0LkXocW1MBZrXD24bK3Ngulj27MYjnRn6fb21nTt/vvff/6Bsw9/22te+fl/F3Wculb7KLNOo73rEXgGREBPV/XWI/DMj0AVwX/yjvff8crf/YJ/94JPO/xyPQ04XV2Z6WIgRZBHIrRaUf6l8HlTsvfjEYyVkr0qHBJ7zNlJXuDQNzAc80LQwOBNLCDH4LJBR9at+sTtqVM8gw8Nf2oY7Fkn9OQpmZbPPMlScNGr0Jb8gBfA9c26xlm93zguPF+74W0yG6/qU8eq1t7r67PZgY3R2vrG6s4ttzx349Nv+bS/83df947vRSdFkJtoWv0d7hF4pkaAz4W99Qg8oyOgGud3hb7uHR98yWfcfPxfPvf2jVt0M+O2nor39UBKSD0X6OuBmg11YjgdqkEVhIv1BKBohtlVQ76BC6x+QU6MFJEWtxcfuL14zIux+s9sbZu4v12pW5AGOUxsgTJHYz956OOaIatuxddvo9GHD52U3t4e726e35mdO3dm8lv3v+f//qZXvPhPorHfUboY1z56ZkZgz/+PZ6ar3aurMQJVBN/0y/e//Pbjx1737GdvbOh1mVPdFbqqRYovB3JBkEch6qYY8rY3kjUA4+XeSJO8M1m7ZJsDWSwGfOripN8FODSJf9mWDeQO2sXqT8m1/BeFG/v+J76YUhOlBWcLXgQvagJC61PB9HHNkNOlvJptpkcsXAxnW5u7u5vnnpy8/0Pv/omfWPvwq/7NV3zFZr+j9KOGuBOfARFo/jWeAd50F3oEmghUEXzjO+//g8+7+brX3XzLgXW9dmWqr0tY5d4NXg3DlSh/Sa7+ksn19YW5wG3iZlyVa8CDo4loeoxin4gWX3JmaAiA/CMZ1eIbGJkF+T3G8LSOLImb/PHu6h8bHQUPsg2iAQfyMtD6XTB9rQ71EL6/uDFXhrPNzdnO1ubm6vvu+41//+sP/9ZX/c1v/MOP9mK4HNU+fiZF4OP5P3gm+dt9uUoiUEXwX//Kh1/xaTdc969uvlk1cDLT18uOJ7rw5Jti/IYYJWS9P80FhKRPgvYqkEQd6IHm0CW+Cg48ha9qtoArerENRCFKV8NThaJBLRbAlB/UAMh/5HIarWhMosEke+iUADLLbeARYaAnMIwRYtAw13VBSNXa07zt3AxLlp5v7eCdpXp5t24jnY23dEfp9uZour21tfbff+veX/wPs/te9g9f8Yoz/TRpRbX3z7QI9IvZz7Qj0v1Rco1rgm985wf/4B0njv3ETTfpa3NX9D3rWQTrphhWf35LDL3i5utWmZzVOUl71UJMCw8hWwMWaqgLBhq+0leMHteAfkkZBaK2YvMY1hReGDf41tey476RqwpXNoqv/GC80EpWyIE2AAucCwP7mhiKYhVL94yVQfQ1H7qRRi9y1Y00E26iWZuN1w+M1tbW17c/7dmf+ZIvHN3+prtOnz7I9xr2G2gWwtsHz5AILHxAfIb41N24iiNQd4e+/pfe+/s//eab33jrbQfXWAkq2U50XU55WWdElXgpepnbo+AoZlUUCF8Le8yOlsl/qAEAuTJqQLPCix6Ti4exYPDVWhjcwhgdxZj9Ar1oe/BZMO3Chp5mWJILPfSFloiSW6a7oJWAiMv0Ii337RziFCnzjkcs/JVOWhnqBprR1uZoe3Pz/Np73n/vv/oTX/2iP4we8fVHK5YD2sef0Aj0FeEnNPzdeBuB06fjK5R+/Jfe+9nPu/mW07c96+CaVoL67sB4RlBn3vR+0CiCXv1JeGEVSDFpNnRTPNjmQPAEEoKaGaJ3gk8ho1UZ6q0yA1sCZisk4oItj041jwPUAERDT7mS8TB5is9D7QY9CZeuC/qyuSRT+qpHb7Wy73HJtQzFuNT7sYrEeVXIytCPWIxGEx6xWPPjFSOtDFfX1w9M73j2C7767//kr/xjRHi0gmK4pLIPewQ+YRHohfATFvpuuI3AKb027eTJ8c6Pvu3eW15w4qafetZtG0e1+psqua6KT4uOuDGGHF3PCQ4rESG4i3FYJZLQEfIOIMcBaq9GGoaenXljON8vyRe/9TW0uUBC2Gu2so/fJWtxIcpH80NOuYGPceFDfD5O3pIhHjTz0y/TIdCW8EYlznRYGGdfuOq9ItaAnjB6A9ZWxVCnSn2adG19Nj6wMZ5sHDw0fd6zP+OP/93XvfP7redui5XK3vcIfEIj0AvhJzT83TgRYHVwSs/Bf/Mb3nDoc2669XXPuf3Qc3TtL4pgnA5VUo5XprUrQMMUE3RYUQADDE7N4wCHAYl+aA0M6K3FFTIFGtLAW0UHRNEpEDSP2TU0E3JX9KH4lEwxpazlGz2WW+L1vJb50ZPMJmm3MP+yAxu0GidwMV6zZQGkrPk0axbDib74imK4qhPaFMP1A+PJgQMHd26/+fbv+OGf+IVv0QHf5U7SMtX7HoFPZATqf/UT6UO33SPgCLzl1x785y98/omv06titldWR2vKyLqYpF0WQfKytyx+CDlxV8K2lmBKlJcdhtnx166+AUPCDA14kfFeBaFw1YeW8Mtw6nLXwsmIXLrVOBA+lq6hT/lh/NEAKd3zn3sJ7+LV6GnHLQzLXuOFedf81IOvr3Hys4bcTbo13j335HTlt3/7fbP7zj745d/5yi/6+f5YRRP8Dn7CItBXhJ+w0HfDRECrQf8N/uyvPvB/3PHsE1+nO0H1ljS9OpRaoCK4q/TL3aHkWCfdBmYMnla0ARHoAT/ICz8UHiOTcY9u0LkHDTu2n/3A0o6BRfBWMANwjBt40Je0Eiwfiv9j9dadu714BzuN7eKz2JJf0Kq1cPEWzT2BpdDmxmlSVobeVkfcTbpyQK9ju/XWO8a3bBz7se96/c897+TJkzv9TtKFKPbBJyACJJzeegQ+IRHg5hieh3/dL3zgD9x+4w3fpRsrRpPV2VgJVN8cQePmwnDNbzIBzERNfnaObhO1cLA3KI3USMxCLuBzQGeZBaJ4P8q4aNXbhvhbkaJVD88Aw5jMg4wA4Av8T7zlk264BBFQ8/wa4SKbJvygOwnEtfypGLdj4FQ9yA7OpWzJFR+2rF6IwlEMtaoHI9Jspgdh9F7Y1elzn/38m6f37fyzF/3oj37RqVePt/Ngp3do6q1H4OmLQF8RPn2x7paaCJzKm2N+6M2/fOtt1x/9+0ePjUara3pWcKzvklDCVCJ2LvVNMDoV6hthlCaHG2IaXYCVQd2zqy2JLb0SPiRa0ZZhE6EnA/0AFxF6bgALPBp7EgPDnNmoxFsm9Vm/8KWn+JbxyT4Yh6+1/1F1tvqXYKuxslBddkCVT9ipQmf+Ytqjj2Lp5wz5gDNaVRlcXx+trq6tTp9z6/M+79U3vOi7ELu73zyzR/Q66umKQPv3/HTZ7HZ6BIYIvOVXH/ypO59/4it1gnS6Mhnpew2czvV3aSCSr7gpiNWcp7Wj5w/Y4wXinAZ6oBcgIZL6IFv41OFhgxsKQNlAZ9JbPYWDbYDFN6gqGTOwu5A24AYhsy3qGBwXrYVh1RjUxVqt4qCbL5n3gj9eXNlKVfYVuGJAzx2tXDOc6rUIU54x3BrPzp/bGX3kwfvH73/0A6/8s1/9ha/v1wsrkr1/uiNQf7tPt91u7yqOgJ8X1KMSP/mOD3zLZz/vWT+0dkBfp7Tu06RKolQApWv9ZTqBkkSbWA3JtcHNM28grSHpreyCoqIvMCwm7wUTxad+AAsQo/3KsTvtBvJHgbHR8u01Bte2gT+RQ9ERcLF/6LYAlq7CVd/iBz0JwGOwepgLhiCnlvXYT+2G4yjYN9BM9VyMXtKtm2d2Ns9NJ+/7rf/2wXsfu//F3/NHv/x3+inSOgq9fzoj0K8RPp3R7rZGpzglquuC//Tn7v3c245d9/06TTZaWZ3pqiBplJTJfaJqlUAzZkMBhEjipcGjzsOEjc8dtKE1g5IpncWzPAY/4Fr9BVdvxvDFuhr8IP9RdFmmpSeilS2etpcZz53erbFbKPqK7AJOg0EuCU1YF2J8gXwy+kAJxk9Q6CsdqDROuxa3oosx+sijpb++Omt3NtldX53e/uxPf9bm9Nz/JZG7kOutR+DpjkC/Rvh0R/wqt3cqvjd3dPsNN/3gLbce3hhN/Lzgyo7ujtGZM+dWEutwLVAw49ocPjIum5qTrfocLuCMbAmmpswSHv201k7hTKiELr4l0TkCWtFhKsYGHnQmzp12A37ZBxsPVdadvMihfwG3x9hsDT7VRWisJG3DEyoX9M6RJdnYhD91mIqOVo+QC0WQGKqqrujmGV8vVDVcXRtN1lbXdm4+8ayv/dv/8u3fIPqsP184j3WHnp4I9EL49MS5W1EEOCVKIN7wjg/8ydtuvv73KWfqjWlaFSh/xqpD1wUrkbZJVTAZlY5GX3xGaDck3JQzvpApOMjluGQXkvmALCBtoVeoQZTxMEieEoEGr3dJSxhC+V50xIq/dNa4+N2n/qIt90le6GxLjIPeghFWKx9K12An6cVjPR4gNN/Mpt1AhyfboMIFUMg8HvFKNr15RivDNb2ge+3AeHzs6InRiUPXfff/dvpNN/BIBadIS0/vewSudAT6qdErHeGu3xHIaz87P/jT77zl+sPX/p8H9KiE7g/ljKhfPMlD88EYeRa4kncLG9ekyEq21VuHBQbIwAV0YcGVqtbWXsVgwKFNgoM+4Bpk7w48vGrVXyC3QEy+gXlRzopaXYVodAx+NLSaX8PWUGP+9S5VeAteZvLDDyBT4aCXeWrgccHtHIqRXnjdOMqzoRLQEde3K+tU6WxNp8Z31ifT2279tFuf+MC5Py/O78y7SBtNGO+tR+DKRKCvCK9MXLvWCyPglPjC47d99+3PuvYWrQKnpEIVSJ8SrSJBMq8NFWRCZ8MBaBQXru0h21LwWRaweAIdxUu4C4oHuOJHzIMG19Ah+RQuuOKjr3HTtzjDaaPmavlGR+FLrsZPuQ93ULMw5z31pE8L/pWf1eecSp9dbnCDrPj5aFOHonrXQAYiTvSgDKvCiU6RrvkU6ero+o1j3/79p9/+kv6VTQS8t6crAr0QPl2RvortnNINMlr47f7jt/7GS44eOfKN0x2/h3JC/oxMufioRIWKZB0ZXL2TZ1GafsiwDc7ZOcaQm2HDNAdtBz47FPgyzajoA1x8jeLid594d9ot4BgbsaQ37ZStvXjKPrTlDSN7ySzzmQdbKFMreslfbFx4yzf2Sy6UpV7orW5gM8x3Xv9rx8P2emxGDxbyPtLJ9Jabb185sXH4r8BJMZxLdKhH4MpFoBfCKxfbrjkjcCpvkLn58NH/86abjuguUb1GTSmQ8sfbYyrJVlIdxilfSdV0cJloTV7OsI1Msl6YhZOn7NXwgr6xs+wTsgsN3j1w5kl8Sy5ecIaLR33RkAVuN+tb3sGTuKFflkuCO3ZFByyYPkhDb77iUW9C08PvYQE5tlzhSmnR1FMI+ZDCXaT6lMRr2GZaGU5WJpOdm47f8qV/6563fz3s/cYZotDblY5AL4RXOsJXuf66QebH3/YbX3Pj9Se+XKcSd1X6yH3kX98lSoiGZJzxqtxZudRoBOBd4smh8UUDh86BOZnKTg7nXfGqt1xRCl/y6kHRSleNIQy4Bi7ell5wKSu54m3H5mn0FW3oW1/24LOt5BngRqZw7iXvnrVY6qIv+GPZHPgkQoP/oo2DqT8EvqWCgsj3GK6tj0dHjx4fHT14zXeO3vKWVW6cuah8J/QIXKYI9EJ4mQLZ1ewdAb5jUOe4Vm86cuJ/P3p0zVcFd1kFOrtGNRwelUDFUvK11krESpxtXiWPFp2EW2PztIwJD0lcY8MlzriBywdwtRkHD7zNtjBOujt4YG94y6bxMKkVfRluxwN/AiXzsfpwYA8/uE13ULpIX5iPeMxGn/w1Lj73OJutfLJggys6eFaDNHpA9zpBsKpVobaV1bXJzm03Putzf+iRjT8JX18VEoXermQEeiG8ktG9ynXXavBffOmr/tCJ645/7s6ubxjUvYLOq3qxdibYPeJEwnWDR4DHA5CkHNeN9uYJ0sLebEmsJGyGlC94QV4DJ3+IwEu9ZSBBMDH6dlj40jPwJj/jj7ql/oGn7Km37jKW/YJ+dBcbcMNjMHGlG+YBj341xsY3tGFcuJYHnIVALsI1Nlm74ThQDHUrqVaF6uOl66t60d6Rw9eOrj947bf96R8+faQ/TuFw9t0VjEAvhFcwuFe7aq8GFYTrDx/51muuUbLTJ34NlQPVqXo5KRIkhjmgMwguYa8a4KtmBg0gVAMugaInqljcFy17d9pVD0+SBn0tDSLj8tc6c2yciXN68bU9cG0lPxhtaeiqVniNLUu/tMG6gFsYzGnFNPiQusEblyvGgZ6KrY6dGjTz1+qycNmbXnBDGwqgcLQa02tRqDaa6e9krIcMd248fuvzX3jrHV8J3z333NNzFYHo7YpEoP9xXZGwdqWn8nsG/8nP3/sVR48c+2LdKarHx/RqbZ0VVe5cvDaY4ark6kRdISQ5F1x9W/TAZVIuslHILeEZg6pWsPscFHxRGsIiWlfJFHOQwi7wMr3la2jlV/WYaG0U3r3kPp6+YrIsu6C3tYNJdINTc79kq5U1TzKXPy1uAU49hSvdjKvxcllWhXmtUHeRjkbXHDk6unbj0J+W3XG/VliR6v2ViEAvhFciql3n6LWZS48fvOY1x44e4LTXLh/6QfulIZkcSYok0moet4OEPxr+AvZGH7Q2UZtXdOtrlLZj4Er6Zmx0LBQLMZbvgw0Lz20u0Bs9C/pLT/Z72bCeRndMIPwsXcVDX6edETG+sc3YqugTdg+ycBdb6S3rQWYP3LLNYJr70q7m/bmGnYuhvodLWUmFkFPou8evPf57f+h1v+hVYb9W6Cj23RWIQC+EVyCoV7vKU/Hc4Owf/Oyv/u4jG4e5U1T5debnBgVy+suJuJIl8SKfLo+HOJroKmpUy+v8WYwiOKHXWH2rc0jy0FFCl7pjlPukmV48Nci+9Npeyy+4xV0Apz6bhbf0J4z6wU+INDM1vHPUgnzJGQkPOpvN9JItfPINtMQLvSBbelrde/F8VBzEbOirNoA6mNxG5UcqdAfp6tp495juIL1m45BvmrnrrrtUnnvrEbj8EeiF8PLH9KrX+NqMwPGDR7/pppuuW9VqcMrrtFgFsHNSFY+LWCbeSoxDYRuyYzKKUCh42mI6JOm06y71LqHa4QCXXhDlR/lYRmtc9At4UZKKBp5mbPniUT/wpJhJSadzS75EW7/lCl+9mIunehDARTAenIHAL9ATbz8hJ6/5c6xuAX8Bzx58yAw+2GDjg4mx45jy+jU+JfGrYsi1wgk30hxeP/Ty7zv99t8l2uzUKZ1e761H4DJHoP9RXeaAXu3q8p2iu6de9zM3Hlk/+ApWg0p9SmvKobrW4+SZQWrhihu4yOCB8bBw6i3DmFZ9jGK/hCPBViI2A3RtZitexrVBbvDIXHQMsVrJp6z1Fa3t4atxytifVi7xRrFbGtufJdzAU/hWrnDYLXi5h4QMLWkG94AHPjPnDtmULzq9t4bPNPDg2BlQz4FKmA85bLyCTY9STG+68bbVo2uTV4ljdOed9/iQAvfWI3C5ItAL4eWKZNfjCNxzj67tqH360We98sSJm25VQtM3TJDmIru5MCrhLSdIkiB5MHOhdQGT9fbKfE6o5ordwjh1oSxOy6bexLfJePADY7TsC196F3r0LG8lmnj0XMADLm0UzXx74AZ59La60k7p0S1IA93KIezFvwe+bJeuBTupw64J3l26Zghv4faSA1fN9BpUn/obtnjhd/yZqAhqVahXr2lbWV1d1+nRa7/mW1//+mP9UYoKYO8vZwR6Ibyc0ey6RvXIxNGNIycP6Et3h0qmt4c4UQvlJJkZcM8k2cQRttoadICVRdW7WKpv9RW5FDCuompaMagHtCxwg4dQOgd68pZenCmZJdHAg8ytdFmm5LBRiDlr2C1a8tpO6boIb5LnOosfXcC0hO1PwaALXuotk3TgC/QkznjJtvoHuIp2kOf+aUyrY2OoKYh6MffudUePP/eO6Y1/AL7+KAVR6O1yRqAXwssZzatcF6dFCcGP/Jv/9ILDBw5/gR6gV2uu6cwzXSRByDQSJy0TaAwWx43okKydOUnYi6xGDIk6lVWC9goxBdyxo6kv0EMTE1dwMhSf0dqVrbJR43Js4Cs7JUOP6RwXbF88CL+G8V7yxZesA2/iB90ag6INuIRbmdb34luQQU8VtNTZ8lkXei2UttJO4cqR4ZhCSF11WhRxbprRZUFuI51dc811o2sPbHwd+H7TDFHo7XJGQE/r9NYjcHkikKdFd64/dPRLjl13/KAKFadF/WGrvmeVRNd89B8MkwudGLVzMlbvcXIMCXqQSL6lMTJOuOATGMYtrkEuJHJ41GwPHvwxJnaFL9zQJ+BuQKYe9LEVT9FRKXgY7gVDbCbV8iJOG3AN3OLMJB08vFl4H4cc0DHGv8ZUwCVgJblLXYwsm72prZ0GLnv1FiB84XMSeP2GX40t84vkm2Y4TSrEwfXDv+/UP3nD7bpp5r68Ft1I2Hrf9QjsKwK9EO4rbF1orwjUadHDkwNf69Oi/kRvzjgtqoxXyZbsZ5gsSFNKI0kOT9qDEq4SqHn22mUqdJc6ykbhEFuAPQhl8LK5AQsYxgl7nDT4BnZwFgCb+OJLGmTPjV6N1VS1ZZr5QBITE4OzlQHTkJIhOu9bWeJZJAldIJc0YjzMOeUXcOJL9HA8qqBZqYh13KyH497YK9lyZeiTsLdf3D0qinj0zRTjldXJzvHrb7j+hvOPv0Ty9/Uv7h2i2IHLEAF/Wr8MerqKqzwCdVr0+9709uetTdY+n9OiulFUX7wbSZZk126VlYcE3MQPvpY+6GgUWE5j8zb8hSi6SSlXesDR2jHwcNq0aNmbN3elt5Ut+qAjTx2Cp7UygZnbLv+tD2IVBxHKRrrvqbW6ir6gM21bBh01Ln1iHmjgGBcte5DLuIuNB97SU33paMeC3Ro7hWp7f/hJhGCdGvUX+M4O6f2jBydrXw7pta1Ah3sELjECfUV4iQHs4hGBOi168+TaL7nuuhPXKNfx9Tk8PRjJHTYhK8kJNMnowqsHb5x2WRMGGY9TsPgQUK53K/5BibDFR2+4EIw/BlzJ38ob/gU9GgzjPfQVqmxZZymkHxjm4IArcvHsMW5VFEwcSkcjGvFOROGHmElkWAUmks7HS8y1WrecCMOKr1WA3WrJ4yE8NPTQQ4thIHIMiVaxshg0bX4vtx5GPTg58MV/7P9907XjV40f76dHI159f+kR6CvCS49h16AI3HVX5LhDBzZ+/8aGvm6Jk6H6NK/EJ8gpzQxOhN5lwmvh5UhmEkyWIYk6UQpZCbPECs8YmXYMIrwo7ujhYXPCR6ZZQQ2cyaMufKix+lpFWg8CMGVnEN5ALe7BN5uJNUY+YYT1uzCGFxyt+Ko3f8oWzqdWl3GpAJ5S1vIbFqkeP7FeG9zDZuHpaXvYKn0DrfgssKQzcRwUEhQP2sdHqtns4MHDn/F7rrn2RbDk6VHA3noELikCvRBeUvi6cEVANzDs/oXTP3t0fWX1811MSF2kRJIiTJlwK9kGMtFmSL5SmDLwW0fbC1VFLUUH4dLfFjTrQE0xqy+91i1aPRMn0LpLT9ku/sJbFbvU1eKXeeFZKJitDCqaMbzWGd3gp9FLfLaTfAt+NLLWzbiVXRoXbdAh+gCX3B4yF/AUb/WhxnNvea2++cDhQg2ymuSHpmLIhxSK4UTfSHHs2PHRxu6BL4beH64fotSBS4xAL4SXGMAuPtL37sYjEnccvPbO9bWN5+wokXHbO8mvWgMa7XGLhFHjISlrSPFoW8l8rOS+ILOkc0FWjNZZ51ZzvGAHefDZ28caL+GCMXWKx7zFo+HC6spKUy88jNVsZw/aLIPBJwudEswNfmB0p9Bg1JxojN8lGZAhkrqyMA0+pC+MG5UpIxRqMUlLOPQlHlrDU/xGE28VtuK3ioaX8bwxD+4e9fcVjtf0cP3G2voXQe/fSDGPUocuLQK9EF5a/Lq0IlCfzA+tHfjCY8dO8Al+6sDowzy9kyB9wgbacfGQIGGiI/sZCNjIZuckmnR3KVcstokOK5nrMD6TvnWUnPphXLhBWQHiEWi+RFmfkQ0tdZlW/MmDgla+xoMe+BuZltcwRNP1OUOIwAUSODZoVBrGc76ghcwAK8qcw6bcoAU8QNu3+LDN3mzzU8mJsF7BtQIuXegIA9kZATJaDW23kOr5E8pDyKrQ4NrK6ud85z/61zfDxnXChr2DPQL7ikAvhPsKWxdqI6AHnJ3HJuO1z1tb8/1XwztFSbJumekqa7UJr2DdC7HQEFlIkMNggW1gsh4ZqB6u0l2w7ZcTqQYe26p+Ce8pQDNTEtW1ugtbLO7Z0dTbRvWgEq4JwtriQjfYOT4KXxa5QTDGQ5zlLHyS0sZEQ0fAjFPe9SN453phj4KImCXp64NDkI33AjV5yhz8JVOWa2x98BsRPTB6Bl1Jk5qhFSo/0FAKdZ3w0A03Hj5yJ0z9OuEQqg5cQgT6XaOXELwuGhHg+uBdp08f1Cmrz/L1Hr0jsnKwE5+yohPjkNUWxyS5SpAtn2FMIMcg+QArsQIuNHjTjjvtSnfxDXgQ0OkaPvQPK5risdBcV8tvknbIINvSys8UX6ShW63kDQ8DihS6QtILn1JuKXZGxEhsLijSNrBxq5Jbw5cYKGBp7rUrW4EVB6tJ4V2EllQhU6jgz30qzm6BhCHLqbD6mIvqcTK3fwcI5tR1XlQDfa2zfmaTyeqOvrB39eCDY26Y+fk6GwF/bz0C+43A0mfw/arpcldrBOr64It3b3qunh+8w69V01fKEQ/ym5MZAE19JPeAK5MWrhLfgLdQk4itMJADrzJp2bGeUg2SU61NMx0cNFr1MYq9cLVCIUnDU7bqhpoam4yOhsc2cjzAS3oY0ooOEHAoKzjO+lEQtWEkKt0gR+HaFS74Q6f1ols/c9qcJ1Z/2Ml54atheLAVhMFm0oJp7nOyWbhgy8KvjZ0/FNHnZlwzHvDwqw3yxR9o66JiuiCrX187MNpYP/y5kO+6N85GFGvvewT2E4G+ItxP1LrMBRG49vCRz9St7YdEoNRwalR5Sz+uJpkMRfD7I9U76UFT0qMzn+CqXbWYAd8mSLFGos0+ns9I3FIC1XBgtg4QqW9hbI+Dd7CFrJp10DeyldDNkLRBTnyWKb8ZGxHcBdMvr8Ci8LX8ITjIoCJ1Iev42n5jIMyYseRCiGNBpLNh38oCF3thAGIXjChBjkDbDFaRBAdvbglz21Sh69hVHwpDXcH0cz9b7IUwb5rB6oq+kmJ1NPvM0enTk/HJMc+r9tYjcEkR6CvCSwpfF77zTue90cZ4/PyNjSNkQWUrZ0xnOJJcbc7DjBU2c3ingbJbgQXUOBdBQ6DBlz54BzjxA2MBFoCYiBonyte/gIcKPOezbuHp3dQ7yddYyIEGHFwREAaFSHzxRgGEyApsvoXAXND2L9DByi2QlCNza2xc9sCwhK85AeN2zWc6kv4NWfj1m7gWzsKXfqLYPhMvZCyU/KCWcAtjaA2PaRq7lZ7sB92WYSbR+IJnWNbWN249NbnhFrCaz5wh2Pq+R+ApRaCvCJ9SuDrzcgT0IL1LyNp49bPWVteCTPJyQlvMT8Y5OytJq4elWWjMVYtgNnjMJJL1LbBcgIsKFLwUUHTQXExLfkln6Q9/055kGCNiMWADaJs30xt8FdPiXe5Rwpqm8AEwFjb9GmiENfM7UtHUU5DacUTK5HbOwZO89QmEIyU7xAWbFSGXujwQxmpnf+AVn+MH3YLepb/A0QxpN/e/KA0dUGqwUW2MT/o4Dq60WUcyDfo09jRg0+R0Gv7G9cc375DYB++++25EW7Ua9tYj8PFHoBfCjz9WnXOPCOh020wPEq5OVid3kDA5xVDJy5kpExgwuZRs54SXMCrhLxpjGCBXanOBKblCmwGmbBoPKAHY8HhA5pj6goh25WcJMm5pBacFd+YxYS4/6GkYC+feehGKohfeIU+5CmVcf6wWRYoRNAsnF7icADGyKILMliZt4HJYuuf6zAKjeCJC8bjnXIexQZIaak60RGlQRTvmwqluivvAmPx0JYMpF+lCJM+Al3m708i2YInJF4HyeGW8e+TQNZNDRw7fIb5/f+edd8LSW4/AviPQC+G+Q9cFlWBVB8ez11z/6YdUyG7KZDgkpUjUypFkMGGdVJvMCiPD6iuiLooMkrAgJ3TpHehigHUYAwtnuYJzULIDDdbkNW6BgPC8LRarwA/60JGy7rVzgdA++pplFUP8C9i+W10UMgqXCwM6E7/YDQTZtBbzlQUGFLGSRhY9ZccLTfMIL6TxOG0g/fMBC1zoCiUxF/xDo+RLT1ooMRO1Y0zcPJ9CNv0yPyTcCO3JWIO0pUI4Wl1fH62trD0Hjnv7DTMZqN7tNwK9EO43cl1uiMCNN99wfH117YZdLd1WRjw74TNqQ+I1o5IY+cxJrsl0ToRmaJNqMRbhIokUhWqoo5GUK4MaFoHeyRpYCdl4cy/Clkt9yzztOEXdgS9a9RACDuMuU9bLLooM9KFQaQDFm+ChYAgBJXRFH/MM/litmcmyLKmDFzNjrcB43iBbBhkbYSli5iIYKoIRhkEIOzVAtyyixwVQfSgLuYUBc1iioybtAC60QhS9FU1/mBdsqAWQJ7NVnYZf2d25fUFXH/QI7DMCvRDuM3BdbHiYeXZo5Zpj+sK4g9yuT/YkcZHDnMBIbAxowPTakdNojAsuYJnHfEY2ukDSSoH6kkvW4fZ95+Wih9TgU512tc8lKJ4LVn/pZM2l+NtxqrZTxttmKA3+uQFWcvUTjiMtjIq1IWIFjxUlzgR0qKC68IU+XDNb8Wav9bpDOqvJeA7aDeewQ29EzsRC2KUBYz34giFtEAYiIhTJ8hdYz88IwfzoSwaR4RQpYuhivhC0UWNBLTQ+vAiB7ZwWbLpzdGV0YHXt2fCeOuUrjQtifdAj8FQi0O8afSrR6rx7RmCys32NbmlfH3IVic3Za57AMokZD5kGC61JcoEj04E3db6zjmW9kIUbaDluhYvmPtUBW78MGc4xcNWNFi4bAy/CVpC20y708B4yK8CG3vBQJFzkSkeOC8+7RYciCI8UuTAC8uMPHSiHNKeFCXMIn3eJwmTG0GOe1M/KMfSWTNOn8xTSsmHrKYOeBfteNWKrVr7qKXT4SEGDxLBxh2kM7sGXm3Hmjp3Z2A1adD16df3o6J3vzDu0GuYO9gg8xQj0QvgUA9bZL4zAgZWVa9fW1jklxiKkSVVNYpOYk1z21uLslvqQy2QJuhJkJcYqTuamSjat9CLDZrXeBVPpYAS6dIEHpndTP8CJoit50+AhuYOvXcpFsYCfwhS9GeGF2QIxgIexy475i5g4E9Ez31DisSeApHjlTOjyyPqCAI2H6pkgMN3iT/ClHgcu6IFHObrVAxpI+lDoQhZ+6x/6xCPnH6sYeKzPOucfeOq4mdO+whB66YfmvzD9oYXAiT/xq++9Bpr8W/qrGCQ60CPwMSPQT41+zBB1hotFoF5vNVk/cItuGyUZsXjQN4pHAiN/VXYiUQK3OQ1EFRXuPnRLhgW+IhWyeNRfoLNoyEDHBqB3MTZJY1AFu9fOfMYymI8Lbxl0Js0FIi+2QZuP0zcxzvGh2MWBRD40YcqAjcZpxSKrnEnxfKaDvFCc/AxN2lOg7Vtd3QuZUs0o2lw/uobQY4MDQtAApVJvz7NtrvvhY9jjIIc2n3Y1HKdEqbtJkinmpe8U1DdHoG/pC0lApe/pVtPVaVLPjZ0BdaHK9uXDxnXrqz2HNXHr4P4i0P+I9he3LqUI1N1649W19bHe9rHcIpEuY2NcCY385oQooODKkB5HvrVQ6aOvZrAZgzc95bx4MjIkoNU28JaM+vIFoGrVgr20ZZxgFwgS/u7cUYqLa5dtwRQGBMl2FBOBSLELOqNg0DjxyQ+fVRQzfNDkoIsklcfC9PwGg9HBGH6mWhcq8bt+o8eyZhzmgwoXPYJg9XG9j697chEseX3qQZ7vC/QNNagRzA61XC+kN9LzMhGEGyQwwxQSYdn8QOU5CR966GMVrGXh4QOPnzsYmvq+R2D/EeiFcP+x65IZASWxw6QzEiLJilzmRCaAQuTXqjlRQtCmBEfyq8Qm0Gj6eBAxxsVjXdBaHS0MTQ3VyNBqpWkYgpp9S9jj2qXQAh0+be5SZqADMF9+NL9qnr+dxFbwmCbQ46xMu166iQLeOqLQVUAsGsRSHXwiDPODbqw8CQGJhzMuzql74E8eFIYvyNmFJmgC5SMFFjkXSgElikVPD0B4F0rZ5BQAPESEisZNU0yVLVoqqeNu360ANW4hH/4YlyLFOsSZwirVzGFlNj6yduDAURT0h+ojjn2/vwj0Qri/uHWpJgKznZneraYEpQzlNEUGNURCpUBGQeSUqZMjY3HABa4afF5JqYOPcSVTSNYKoK1olhEKInDhQdFa3KAr+awHnixm1aOLAj7oHhR5NvZ9odCJ7i/GxbeIAKqtAD7HhHEuT+P8scuGbIfx2FsKFW5R2DzrQoQdjWouOJnuCxdB4LpgFbRYqoVXeE/DnxX90FtECuAP8TCuNZcL5Rwfc0QDfFTJmBc2pYAloQjM136EIeHmgOOpQsYp0jpeUmJ4+DtAXYlkH7EWXoQ4RjweojlMVsYH1o9eeCoCud56BJ5CBHohfArB6qx7R2A6m645eZEIlROdsISoa0JOnBJ1EstEZ5xg6oBrIXgrmduoMb3IcaoSGIG0A7fFNHZyZQxCW8lrVDXIeM72VYOn9BvdyOFj0Un88S3weBLNN2zUQH3wUh6U7D1OQyIMyTz5XSArIOAQRrKc8IgdJYk+dQGrDYW3nAx02pEeTXK4cwn7oleBig8nYLQNRQnbjrL5omhq7bqrl3tSvPKA2YvyRQOOReBCHRMvO7g0TJHlpxH6GxGs1VyMa8/xFIwZm0qYw2q/sGkZ+tSFsfVS0Psegf1HoBfC/ceuS2YEZrsr+jtiNUDaIk9plaJcxSk7J0XyVuY9cphBEmjms8pvVeBgMF/16EQxLXGAJV+6YUK3C53g0lHC6CgcfW3oquIID62lAQujLVY8HnFNEF8ygQdHSEehyQJWxlND6GEfxcmGGrjsow+abWNHP9EYFAwYDhBn3yEKk1iiSSoOiYvL/PiIJasNel30JKPZSZ90Y1cHw0VJCuAAj4w/3Fi/+GCg008AQOJ1EU7+tGO+YJcOcTvg4m4KaaqzKvwXm/do39UfCcXf7kGJiY0nU5aivfUIXFoEeiG8tPh1aSIw21nhFN/uzs5otkr6ioxH0iLpkYu5+bCuFZqcCXq4WxQ1icsMKAzIKFJOmKhmo5H+MMM45QxDy+bEKnrhq8+zkcajpvC2nzqBwxR7CkHwmRcYapBEzSJkVDgDPXgNmacMxVtfMIRO+PEi1LmXg9YfUi4aVbiQtV1LhFT4hjNqqFKR8XU76RnkJBY1CQZ8i0LlwseaHCViKH78sg5UJi14sRN8MdYQh3SALGM1REQ6mSKywTGsAjmWJkJHNj8Jtf5BD1ErsYbwDX78D6U7fmIffb31COw/Ar0Q7j92XXKIwHiT1cgkMpmSVKwgKpmRekmKu/rmON9cqiSWrD5lWXDm00yAoTzzqIskMLzWJ7JrQuIGPsRIkmKCDv9AA69mPdkbpR04wyoirD44HWhEzsWn52xYO34lEDeFzFdiFIJK/K0hr5BCu4saisn9UQQ9YmBZCgNlhB904VP18NCMNRhjOxRYfyiIOVNgrdYS8KCnYj33E3zwWjOOqVF0wm75kzj8k1lLoE+fZOoUrCWRQ4EPjise2vyGGdyH6jtspST89EzRSv2uK5doyOmiLX2RAn8QCKrivzMbTf1V0Mb0XY/AfiPQC+F+I9flhgjo5NR5J00VQxcHZbQVISORkgSVyiKfLRS+SISR8IBrjGInTTIrcnTqYyURMHhw1Vp+ozO3F4/zcjGrL9GBDs46lZjlbFyXAkfZSUcQggc92dfNLuYzL7JIIBPyVpxw6NNAsSLBoyj00YfSxIiW8u7FX4Y9hhpt/ogCDBF3KPaDoOKN5yTNTNKY2GMr4g5NnGJ3EcS/GAgv2GcgdbpUYl7RqgBCrhtz4iAHvWwwR6/izCc71hH+IQu3/bJWGZeZXRHA4TPzRX44JepPD9iHHvPb3N2KgTF91yOwvwj0Qri/uHWpJgLT8ficPp07yTrRKzU5WZE/JyRYJTPxK7VVyrN05jMlO5JaoxAQHQgVHmHBNSyAcRU5+mrWB1Fy1gOhdFgoOMsufSXwYUVrnIRcRKCXTAIaUkjyV/R0QIzxE/zsS7cxpWjgwjG10m+FDBLvcasjaIO9lg81g/6AiW/VNczQbEr+pklpUIEqigBg9BQ2Tl/mUcQty5Z/g0LJOSJyndVgapeYC+KCn2jGUBRGTpE3bsffROnCCxG9gdNkKMBeEZ471xx1meytR2AfEahzF/sQ7SI9AhmBne0nd3R9kJWCk7OzaKZQ3VRS9QHuTI3uK/EVDiS84MEV3XKJJ6GbLgZOpQGDs2yOi66hadbDIOnWJzjkQRrDbuCZ6yDxCi1Eu8UqRfOVEuZcRQlVXlFZ16LMIC+D8IVZwZpA0ELP4iozaTVJ5Mo5F4gYUxhA0wOULayAj36Ohx4rK+znKUfkDEvAQhaULIVI+j1XaJBDF5rNqzFl0ToRQx6elDG/fKtTm6IUC+rVtFPFtl9DvBkLH6qCX/rMJPR0tnvm3Pbuo0i/9rWvxWpvPQL7ikBfEe4rbF2ICNQr1rafPH9u59rtedITjYQWq4zsKVb5sYscmWfJUONERx4kx5H0BNINvcB5g6DmLmGPC7/UQ7O+4lVvO4OQki0/XpmAlG4SeMMPWGPzYr3olmUYOPdYtI4YlU73yRcK4joj7PhoeurFXukMCARcBDJp6sFEEY4iEjT2hSfoEcyknQAAQABJREFUUUxZGSIRK3AdF1ZtaQ9K2bNOENksJhh6nKqkUukY1vE0TTsXa/XgG73xwQD/bV07aUw6OrnfhQLKGVFI5oc9giCO8CCOSxTwLNhP7qyvnpe13noELikCvRBeUviubuF6xdr29tZvb21vjQ7s7ox9ipRVgJKsvyqIpEiGy0/2TmnaUYwivUHXBkvk16iXDY9IAy8w+RH+SOgxbmFRo4kHVpp7duDSjmXwVdpdDpO59EceBhmeOhFbgXSYad4HGuXoC0XFj3YRUmZesIQ0HnYX5zATWJyE2tipOdJjB7VYCpa6QxT9ghuf0eNJK7IqIxpADT7kbZbjI8W2IS7jch8RCjscXwrVvLiFDCbCm+h8uKW8rhWb7B2FLG2mfuonfAw9HzGg338zdVqaY5ax9epUc5Rf589eu749192hHoH9RaAXwv3FrUs1EZiujs5ubp0fHd7Z8auvIlFxOz3JS4x+5k7JTdmRIY1E66Snna8PMQZB/ium6pO3hJJt0G827SyXxFqcSDQaRCVXn9IEgy/lj0guRKC1USR2shCFw6zclInT6SpOcBccPlMyUAKeRA3offZLxQd68rujRgUm+NEjjIuCoNCFDmH5hVg8Am3RfhNnK7M+r/zkvOUc39IrMhzoET/zNqw4gWK61ZCN4gemDhIcrDaF0UG0O9rz6AQUNk7zQoNIcaT3HbcCeLtNcElLHQDkKYIw0iiA/Gheu7pBVH4I9MYxe/A3/ujhM6M/Ji1xh03I9H2PwFOMQC+ETzFgnf3CCEzHk0d1jfC80tWGEp/ylJIfGysQZ1ayX57+IslljjMo2LkbtZn/KmGar9iRmed2k6w63bFKdBmwOcM1Rjmn0yIbIxTFIK5BhRC8KS5uikIk+TARxJiPXLHikiNRz+Hgx/GQYe62VhMVPrjtxiCLXMUr1VkVuBiXVIyjYJjF+rzwDolAYlUiUdZKd/LLF05J+lnB8iuliIKPHVqloJ4nNGxt+J8Fj4NIsyHgnDcoQMUcr1d0hsB+EIuM60zfShErRg6sfGFV6IMf6oR0Y/6OtyaoZ1XZS8dstH3+yUfeOv7SqWCFgtn31iOwvwjwkay3HoF9ReC1r3WOG22ef/zx6daWH6FwGdQnd9+8QRJ0Ls3kqCTnxAhOFqHR6KhRAEYlDI2FWK3u4C8YWo3B2Q7IbIVDI3neKw7smxG/gMOvRAUP/ELEhl6SbiRedBTNZvA3eRkXX+BCBvvzO2rxY65vzhd6hpg5GNYYZsrB7Mumb7IhYuDVfCMKICjZiTkHPuwGL/LFvzvTw51qXrWptzjz5Acd4sV/bJjGXjAfFOjRi110hv81P/U1jyaGWBCr2yBT8rrhaqCHGYbWjYDnq0npQ9dsujsdTUe7HwB/990401uPwP4j0FeE+49dl8wIvP/JDz1yy4EbH1LiOxYJNx5JV450q0conIBZhaQcCdELCpKdcLAzRs74ZKSD1wnUg+BBTfFXcrWc5M1vPVn8RABnn6yXRI+CsB3KBWexQzetikbACGSzPpJ6FAEcgTf8oGdGUo7+QHqOMEDBOFCctkx++NLPeRBEk9Mhpdhp4eMCk3pDxAPbgU8j7TEhWB91KYi+BpcfBOyZ7OCcXQPEhgagrcHBEYdwoRHXTNRx0mpSP7EiFV0K4UJ+pU6RossWwpfUmtPCTpwtCJk8RqkjzVgfvgptOIoyBX53PN3eHu2sTj4IWaUwur7vEdhnBPqKcJ+B62JOjM5TP/aa15zZWRndt6tP6bqOo9ym1UEWCCdJ1Y9YTVEEnTWdECPBkeQUzdxy8WEcudho7Shgra6gaO9VRyRjeJCXC0lmlYIGWVWPX5XM0Q3NdNhFi6ImvIjhv5hwzXQgUnusfPw6OQhupR/ekAm8eHntnHWjhIIGj/bUFHXxwQFa4cJPjUTTIynahAl1QMxDP5ZLLOT5qlM0dNGwEZ3oIVdjj+xrzicLoUW1c1zpSwCr4iEuZS98lwHxxLzhhw4CB4YOaV93nf9dwAsTPSI6le4KiD85PxGw4eOBf+Wj+q3Nc6Pp9uZ7sXHnnXdyYHrrEdh3BHoh3HfouiAROHXqFEuD2da5J+7jWUIlNP3u6hJhJESSm/Ja5MVM/iTF+af+ebKEz7VGHbBVRN4d8FFUWEGwWZNhXyJCXg2bzrFWlvbTB4oENFjxgQxqHIIeBdFJXw4EDRk5kkk7pNEgvBwNn2KMlrCtngl4zGqLzcPEpbz9kQ7rRlfEzcypclhDa+xCJA3O/DmRkMGuGNKI4fIPi7YTflhHHpSSwZQDAqt+oimOpcPy+Jc+wmdbxRtyLrgDPnjLBmrtt2UrnmBCbxRAwfm3EzFPO46fMByT3d3J2XNnd86eO/8e/Lz33nvnToDorUfgKUagF8KnGLDOvhiB+jS+Ndr5je2tzdHOdHu8s6tHnXM1Q+KKpK2kquTrArcTsJO2UhiJEjyJMnOgSQhWcmSlpxSpH4pcJE6KIa+btHzemTrQxBlFL+ik4KxlokiXDJKvnbM9ziKBA9gxLRhIzDEfeJBGjtWK+MxL8RJNfGE/V4HBqb0mkvqIR8hih4YtZNGX8sZJwGLMI+meADGBL4qiZdMnI9Go8dwXfAuf6ec06Sg7lsGGi4x9CR8ddM8dT3MSoSPH8MUcgsyxDtmIme2lXUSKht/MQ8ZSP8eVedmr6Ikvc/V88V0fsHzgdkfb0+2PbN58wtcI+8P0RLa3S4lAv0Z4KdHrssOn8enq6n85e/bx0frGoRUSHIVjRW/YpliQ0Vd0hyBFjHv7fJ2LG1Uia5pOMo2xEiJMrPiQyNWdE6TyMo3cy2ruQlhI0dgioQYPimtMXw39jENVJmILwxG0oiOFRzQKrNkycYMLPk9IMGM+AMSdskW3kAfsNKpCSkGwF3jE3MIj+ypl9MYjpJZWrM6xAmMe8UlnvNNTjHYz5KE7loM8dAoRiLTHQLD1m5/PySHHcbRfPjZC47Mfiwj94XPEebAvTaj2PMKZ0Uwq4/AmrfTpuqPtehdueU7ygxEx19+VaqI2wXpc5wPf9/Vfdr+I+AVTbz0C+45AXxHuO3RdkAjUp/Enzj/x387r/Ci3t8d1MX05k4rhzs7UiZB85sTvxEZJUWLzao7kSbJUr1WdV3HOzyR18i09eY4MGYk2evjxQM/8qUCiy4nTmtHuoXlsl3HqikLNSiNl5ADJGjyCLjz2Ey2ggo/n2Dj9KyfNYyL05PXKDVgbhZCxpenNE7zFB88wN+XyshbxC5nAxezhGPy0Vxp7TrECTQXGhY2YT/iD28lvF4HDH7vsecQu5gN/rtDsO3DqExttvlIrPfjXyGDPY2Ih2LdDhSw+Scq+BsxoSU9wiKzri1Ndf9bxkU3dNbo92l1ZeZcq4Myn5lNl73oE9huBXgj3G7ku5wjUp/H/8mWfc9/21tZ7Z3FKVDlr/nB9FB6SIolOCVbJW/Ux8h8rBidz6GxZGF0UgRev8QWdohV6JGE/IomiC3zQILlwtMlZyFjzIBY2nWARzHH4EQkdHHTTBNPCpvb2G5pwwPZf/EzSyMAZXNCddAq78ST40lGi6HHijzngQ4mJBXsimDk6axp8gNf+2EJ4EPz4hK5UpiWb+XKOMdeQhafmVOw1xjdx2T594fEiWkDIsXnhJ2B3yg1Ampd+/CGHOaJJuDgOoQtkFdqKP2cZpvrD2drcHG1un/s17NSp+bDZ9z0C+4tAL4T7i1uXaiLAp/J/8xmfsbk5m/6arg+S0PSpXdcJuXlGCTuurwVMwnROd4JUEs6cPOA8VvEbEj1pspI1SZVEKRQ9XcqDQ8ZFyAyMlWTNAGPIBk/grQvDkNFnHmiRjM1rHZG0gxFeVoZa6dqDsmNhNMnb0jdP7vYFXTkvx0V6ypZXTloxOflLPopg+NHaqaIAThbtizrPOwoH80FOuoBkDxvMhfnRYp7BU6vP8iPoIQOuWtgSXnOwD0JEfHI1ar3BH3EP3+CnBS71trz2LXyFr/xg/jzjGPPQByct+W17Op2cOfPoaGdj/T/BX6/5A+6tR2C/EeiFcL+R63JDBOpT+fZo+h+3Ns+7SJD4KvmReecJTslSlYJrR5FIoVE6KHZZ8CoBO9mKpN40F5HBbCb5NnkKroRvM6HXRUWJNZqV2R8XB9Snf9AxTfK1ky4owQ8BPMmZeYVPJHDRh70g2Y95mwWVyZ8xgN+rMMnaDvLiGXwQn/WjOWVcTIIPXhcoDavIlf/4TpuvSPFBdiRPJDxKXSVjrAS5xme9cJUiS5QPUfAwwbFDV2wBM5eYTztOLtn0XBSbuJYIj1rZYS6CLQ8OOI81+F2dFmW8owMmnrFOwX/4/ofP/AYq6qUOwL31COw3Av1mmf1GrssNEajb17cns3c89vjDswMHDq/urq7PZhOVoNnOeKzTnP6GgZFuoNHdEk7gSqacoqQY0fK+C8OZCwVngiaNii0SsNDIaODkjUSoGACSbv6qj6KlJIoW2yS5VjKPBI46FQLxRBFBITbnegwnLvxDl7hsO/iimMVNMiKFvGTyF5RbFFJ76XHoDhrq5v5befB4zibmLmjeM0dPiGIUJY/xQmHKeLcFr2B6fGrHJavDZ7yd4IYW6/XMhYqTzOGD9npFWs0l+PCHYzuJQEms4igsLhrv+epvhLHjn3gi4Q8r0sFZBV2f1WXa3ZXp7s6v/PC3vPIhyclMv1Emjk3fX0oEeiG8lOh1WUdAp0ZZQo1+8/D5//LiR1ffrfL3fE6NTnZW9eauFZW/uN0TmEQ31h2k8f5Kemc9JUh6mtKbYI+cdBMbFcdF1MQsoKaK2eTioddv7JScGQhHco9XiVWCjWIG37CKo6hUk0wURsRRiA768LmKeCV/bLCpnA7zQ5Xtlyziatx0U9/YDgdy9sb6w27ERqSaa8pao/mof/Gya94Ag1/ly0Ivdx1PcYBHb9HRlb9QccP0Oi4cHnD1LRIcGWaIxoiCwJRbEZq7QqvxflHPXTHFO1rEAogPHeFY6JE+2+aDUnxoQYhjxmlRjg+ncfUmv9HmbOdtaLjn9D0ro5P5xwWitx6BfUag+bPdp4Yu1iOgCHCd8J6TJ89pAfGLu7p+psSlvBV3+kVCIwVGGiSx8gmfZFwJmaISm5JfJsKiUwicvJ1/ycwk8go7Y8GpyxaSRjfYMRNjJVTf0KNkC0ySlv7wI+xYufS5CGIojbkDb9/LfvTocnPlkAhzMG/0tsEcXRTiVWRlp3gZ238pcnFwTNCbE4Iq+bbNeFdo2mFutokNbzUfVITf9IOvFZPkRbYKYNkBB4xuZLkTOHAxF+Zjmj2HN3ylJ06YKBzy8Nts4YVDAp+It+MDznMJ3RRAbOxMtyaPPfbw6OzO1r8nBnUmAri3HoFLiUAvhJcSvS47RKCuE6r0/dsnzz2h119t+bsJfdMMyVM/lahJiJnqnSTBzxMqpDhlan6KFD/ioTpEElai54fEKd1OoJk4hU4eA2GHxJr48AETUqbN+kpXvSxcUsEXyZnTqiRjlMSpOvwPO/DRXKjDyIJ9ClrIhf9MInQzg/I1dWWRiHmZKm5rkIoocqgbVqmecxQP8NYoH7xqC+WWc20WvuYa8hozL/sfNtCBr/Atw1GYqlCGv/DW/C0jsfA9fG3tBRz6uc5qb8tW2nPBzQ9PoEoXvNPptjDj8fbO9DcfuvZa3zFaj+6Es33fI7D/CPRTo/uPXZdsInDXXXe5Ijw42nzrwSce+cjBg0dO7Oys6XGvVV0ijC9zXZlM4pO+Pn6R6CgesYEApwQqLQK1y+tRFCsla5J7PIjvdO/yQDl0U7GkkeDHSrLxQucoUCTqKATzYhVFBXsS0i40Ii9ecBLwygVQP6arVpCYoUVRmNqO6cLX6kciwiMvXnTTGyn9KrT2heLD27DVXEik26UI/vQGvioy6KtW82HKgccOv9iRHzBmvBwPX7fDFWzX515xZ5zLDrPkQi16mJNjkXZDThT80wcPj4FF59qvj0/KMudoshXKo09sdTW3sCbTTNHzj94z0pi4+syCrg9ub2+unN+ZvvlHTr7sCc5AaP5xkEtp73sE9hmBXgj3GbguthgBJaVIjd80/uB3/+gbf0GnAr+Kmxsmk+lE9zeMxtrc1JEEJyqKTtRKlhQ4J/VK6CRQNdOV2p2ASdDQZYVE7ELl5AlnJGnKCZedoihVQg57EjMfe7ccR1EsXukRkcRuQLqg06p4AodZFQtWiWohTSmhkOeIAhFGzRF4EnvwU1CqReGRXPLHfKGGpSoaxT+/Nolv8Ghve0Bh3zOx/4xVBHVzCrRyyYVaY2yHFdjEi4zx1TNPFX0VOhrcMa88HkZKiImpmllbHj+MYR39ctByoZtYhZ/2VwetosF104o1p311LPnaJYrhypNPnhlt72z+POp66xG4nBHI7HQ5VXZdV2sEfPOCJq+3jf7kuTw9ShLTqTDVgbi2FKfFyLlUhEiGFAlvpEeSJ6c7lVhJoEMRqAxuXF6nQk56LINcbsQ/8EHLVBw5VyZRFXZUmBiQpBFScxGk50c+qJbbB9gQtF64Sw6c+KLQicdFAL2cVhVeP3E6tYoWxSfEgzfn2MxD5Gw2KjZJ2HZ5CRnYmgwTp8X54yNiwYcfi7GK+DN/ONxsxkIxFmi9GiEbNjKmsIG3XnQHonxwTKw7aDHmmOJz6AuZ1CL9xmse2ImVoP4OIv4zvVlm5cwTj33k8dH2f4avnxZ1uPruMkWgrwgvUyC7mtHoZJ4efWJz8y2Pzx45c+DAoWum0+mMu0WdtCfj0UQ/eqxCGVbFRwl+hSUcrUnYDMGSEAFYefm9pVksyMCuDclXyZe0XKcfa2USBTf4gSkq1osRNfgYo4+CxWqzkjj6XISaZO+0LX5sIsMpTvuKbubi5K+O1RX+MC/7i504RRz2gpcPCrSwAxSFk3HNC9ibqKXDRcTsKJeU/WE22AnfmK/v3MQn/FCzz4ZSRrDtqOc0p3VpV/osIFmmY58cK8VIrJ658KIqDLxXNo4X31UYh1VMFsQwvxVrhLVJErfijlf8oBhm4RQsffGaPv0NsSo9tzP92e/75q/5oDjkik9ii7+3HoFLj0BfEV56DLuGikAmpx94zcn3nds69za/E3JnqnyWq0FWekpwsfqTkJKg3yHpVWOtNEiESoK1UXTEyt2KFDkPECUBK8lSSCKBgosCQCFDCh0wgldBdqKOwhM4/IqVqvilu1Y9lgv3pCVskOTRM9gXnYITdzSqmIlmffZz7hP8pRdxZGjoQqcLXFP0WnoYK734GEUT2ZBPO6Ey7BBf6GnHcZSdarUyq5i1K0J48bFo9PAT+2pFR3/NFxqreGLlYjf4kDFzzbNiOMNP6Y3jyRibpU9403RspJPjpe8dHD+ut8mcH+/+C2zdfepuNPbWI3DZItAL4WULZVdEBO46fVpPT49IWvf4ms42X82kIrTDK7KU2KZ6YbISnYuVE2wkRhdHjStxO5GTIJVwY4tk7uTsREuS1ebESoEpOklVYwokdjSAL5oIatCjD91SYZ5KxjBYhn7QK1hCLpzqcz3jZI0+F5RUHDbRYSvqgXOTPif68s3+F738ZQycvtLDL3Xho+ZjmviMi/k5rhaSDeTTVjIPPoQsurTZD/TBL30eBx4G/6TO8EkFi3H6UvOqla/HpSekrRffKGqeO3o1lhWPSy99FVfzwa+/GxXMlbPnzvzm+24/8G+xqxtlYsIMeusRuAwR6IXwMgSxq5hH4J48PXrutuM/+diZR96nwjdpH6EgUfouQCXCSHqR4J34jNMqqcoMCVNbrFQC9soQXCZSkjpwJVE84cYO5JzIzRsJGFRrh3JGoqd5vyCTBUs4J3d4sOOVED6HnGWtOHxqV3RR1MWXKz5PK8/oDf5RNFz0wg6eDDTh3bz+kZ7yhV4/PlWZOObl07r44hZ9iUahDr8H/aXDPqQU8q1OobHDvCIOodcxDxFcTpk4poEAF1vNr9hLP2N08vdg3bYdXPrbULh3eWxid3P7/Ojc7vSef/qyl509nR+0Bl0d6BG4DBHohfAyBLGraCKg06N33XV68jf/8Esf3Zptv17PE/Ilqnpd5PZ4us0X9kaB8WlTCkuuAlRGnDdJkqy6go9TcpF4I6dy6k0YJWWKGMndCRkdgqNIIRun8vz8n2zAS3OytU2SuuylL6EDu/gTuofELPvlCzKhCFnx8YtdNv/YSrBo78KZdgyz4pUc+hDGUswfCH5o6ItYhO7waShk+NfaLZ+F41SjP1wkLh5+L59DDjs1z7AdvlQMludThd3+4jdqHDfFOOeOTaHV+GABmjnE23PsTxNnfwgyPf4OKm6s4LGFz/pbiVOi6vX3s/rYYw9tnt9Y/XEs9IfoiUJvlzsC/WaZyx3Rrm/0whfeO7vnntFoa2PjHz70yAN/+sbV9Y3V1bUZN25w4ww3yehFpIoUCTNTKI9EKBnS6jVoUb74rAZP3MARxQhYGDE4kSqBenUEp5IuK0rjxWRYhUFAylBAo5Ahj+r4ImAAjdWc2O2XiWGIAqWf8AldFJAYBRwjq8g5DTwaB97qtdNYd5PYy+QtSjkB2rFRX190iw5wXjEPCuMDQczYqoPHc5MdBwl7xABJxZP5i9V6xGcX1AcrvNBo0soKNuNL3OqTcxS7jHs4K7Y4fujOpy2spbTZ9/LH6mVL3yMJSibUKI7+oKDDqKdPVTV3d6er53Y23/BXv/mVv+nZnOrPDmZQe3cZI1B/15dRZVd1tUeAazg88PzXvvmr3rW5u/1Tu3yR6nSbVyaP9TVN9VyYE7ZXHEqk3BVIsvZWKw/wXkWx4svVDquL4hM9Vockb7a4+UTQcAiQJ9OK7GY+6WAIDl6vcDSwDfSYpl4AKzEXDnoVhmEVah78BY8u+GClQBoR+sHbPvpifjVnLMGPrFdkjAXHJj1WXePorZriFUQBGA35KF4MSybIETvZwRbxwD1+is9w8JpGrNGLDfd0jIkjPVOKDxSOL7hkZY405hj6kY15wzTYlEysAmP1HzzBC543yWg1qFeqPTLaXB39HXT2m2SIQm9XIgJ9RXglotp1DhE4O5n+vUcee/Dk9dxfvzLhvvfRyH917KZeIY70SAVJnBTrFaOS5DzhokoJWAmch/CdSJXQWTW6oGRyDWntKUQ8AuHVibTql8Rq3bLt04Ve4ciGNPs0pXhsD4SwdY0RDq/bnOiDvxK5hdGNPbiAnfCtJPDMA4309svqQfhEMKuzMJl2NIJXqtyqGPlxBMnDWzQYFlZ7orgoJUf4KSbJOebwWyh8Qo/HiaPb9cPssqHJ8EhDzAy+8EkoiLC69wsOBEJfoQCKZL3MIdmQsRh8xoug1XB4gSI1K474aRHIzTG8no+7nSbnpud/7q/8L6/8edj6TTJEobcrEYG+IrwSUe06h6T1N77lj/zck1vnf1p5TdcItzjbNda3lGsBwCqBlUxc0/OKSOPAxwqiknmtMihipFrwcQfiNPvQZX1KyOg0rFxKMbEe2XPR0phsbZyPEwOAyNzF6+IhfKwSYxWKvHWL2ysYn8/Dn9AdssxJRUF2XMiwV60FwWsLO/BqDqyitFHgSwd+RUFESZQP7EC3XcFWxSRUfewDCOajX+v1BEVDv5nn8ha2ZnbEIvzSaDgWiM9XeKFDy/rQBaMYiAt8IZ6+eR7Us+b44AM/YrQvksbH4Y5S8er68Wx7a2v0xBOP6yaZ3R/BQr9Jhij0dqUi0AvhlYps10sx9N/X5urODzz2+EOj7a3Nie4i1WWhLH4UKidLJVIKgZIjSb+SoouNi0wkXRI5N1tUEh16Eq02ETLqZGR+IzO7H5IvLFH0WHSYkb0SOXbhpchwo435rCJw4U/ohOZilXrF7DHyNQ+shI/SRY1JnijUwe9n6RC2WmzCZS05nbBnnRQRCoh6mouh/bSI8UgWzfOzuoiv9SKfcQrfGPN8exTR8CNwwdcWV2l2rcRKxkT25/ryg4IUVqGmuEacJCobrBTDb2zAl3HnOPtRCX1gmir6O9PJY2cf/uX/esML3sh8Tp48Ged0GfTWI3CZI+Bnvi6zzq6uR8AReOtb3+qs/PY3/cv3fcGXveJLD28ceq7OkO4qIVIgoQmkXNDylGAmWk5JkqH5IfvGqgvYKoMmenxPHsPEw+sVIZwk6aBZMottWItEbAvYEQO+oCd0hT4XLTzwIxnonNuqwmj+IODqvCDl3CjyCIYtrKs187RNcOKJd20yoIkJKRdAxigp/0wxCsrQLBKFiDAzJwp8xDn02Q6nj61PkoXmdDKwWsQg4DJiHcxTLfSFD46dcMzTx002U83AF+PF+FYht3kpwU9efKCvW5qdPfv4yiO723/u733jl/waz6bee889adnm+65H4LJGoK8IL2s4u7LlCMxXheO/9sgjD462N89xipQbIXI1oBtpWOXlaoeH70n2FCCvErXicDFqVkMuQCRxtVhtuMR4tegH9rNYUH9qNeLimM65qNbNOdI7nD4lo7tF8bFdcPyKL4AoMiRs/Cx++6oBK7zARtL3NUnxmW7+8LV04p8f0s+VXYxDh2PgN97Mr7nZBzxJv7CPPfPyASBXaFGoZCt9jD7HqjzEQIZDVgWIlTZV0GpTxrrFF/EJG5YT3X3OFCHm5zl5N7db80albpTyyxXwJSxHpJhzXBucjnX8dF+VbpI5++jbv/fPfO0/wwd9z2VfDRKI3q5YBHohvGKh7YqJgAohJWT8/X/26950dnrup5ToVrTp3Jduj9dpUif+LHrDqclMviTYKiROncbHqTgnfBI5iZ8iIiORVknnSuj5gw/YAIs+J2Gycpv0nZghJ13UgAWYL4sxNsoIPLmCtGFkZSce/Uj58gs5+xr60RmFkzG+yzf92k/pERj86Y99AKexbxAafEh/PT8xqKEDPhod+imKxqVczE2y5iE2smCekNEgdcBB3MCzC/347muGZQuHabCKr7aaD+M4jsGmyYWfikkUcGnU38BUN8qoCI6fOPuo7hQdfw/c9aailOxdj8AViUAvhFckrF1pG4G7T51yqpwe3fhLH3n4w5ub559cner0F4WP60IUCa5nkbTp2YakS7LVZhxKlVQr2ZPKWa3UjRyWYSw91olcJuvgo0hEoSDxOrlbpTRRjM0ftnEgEj78keCd2DGixoT0RmjrqBUTeNuTHgvBI3vaU2ksKYmYo3mCjXkwR8+fgonBQYb5RUzm/s55xWj+IQb2LK7Lhe20kXGpOaKr9PHBofDYDV+wG/OrsSiYs5ym4xE6Bj50uriFnP1OO2Ev8PWiA1bCrETzAXpdG9QjNvq6pTObZ1//V7/l695E1Ppq0CHvuyscgX6N8AoHuKsfjbhWyNtm/sH33vXhz/uyr7ru0PrGS/RtEjtaPcVzE7EeiWKhxFkrGBJvneIjv3tV5RoReCdgkjVB1s6JX/LwQhPCST2u7zGGMVeLaScKIviUp1cytxJ0uUhwZo7SZ5XsoxgIiiLIWDxcd0OWKgHNPggQqvxBD37WCqx0IROFSYUFu97o8IFWfYzme2zXCIAN++gLNQD8xC/0eQt/4dP1VvtAsYoxBTIK3lzGflPscg5YKmoVXh8zlLixwo252YtQ7uPiDxr+IKRTo/qGie3Nzckjjz5w7omDk6//xTfe8+BYN1vVdeZU1rsegSsSgfiPvSKqu9IegSYCfpXKePZtp3/6+oPv/8g7b7j+5jvWDxzaWVs/MFlbW5tNJmtRF5V5KVxRAOO5QlaOfoZQ6uI+GxJ13pihJEsxI2GvrPBsIoXBaR8mO+BiIjp9JeXyDNkoHBSr+PZ182WGd1GCQ2P8QN7FQLh54Q0fMFeFovywoHnxRRu/wRh94kwQB8109fbVfsScgieKiu3k/CwEf84RSTfmK6SjUb5pBK7oeDXhNTDwpb6gh68cC+yCsz8alThjf1uycXlyCZv+gl74AjcUSOuSNn94cSB8bVBFkNWgThKcX33giYe/63u+7Y/8ZT443XNPvzao0Pb2NEQg/3qfBkvdxNUdAd5Bqrv/fvDkH3h4a3X2F3VX4Ghr80kS4Mx3CvIgtQoRp8o4DerTphp71afkGtfGSJ5asVC8DLJ6iTsilX61SsnTm+LxKVYlXF+bIvFyGpNeutjQGysvqdLYzbk5YFCJDV6tgqqAxCnTOLVqXfJ3UCHAhUcKzW9FVhw+C297JVCG5T/4Aa1qg3/MI/B4My9W1jF4iJKYV6DCc3tSCimS+nExS1x94FiwQ4y8pQ7xBnv4U3bCJ+LJfLRJBppb4tAbfkbhhYfjSmHkpihWgRRBHSM9Ori1+tBjD773zAvu+AF03HP6LhT21iPwtESgnxp9WsLcjRCBugX+F37m9e968Utf/rkH1zY+U2+S2dHKQX+HTqJ6oYl68qZ6rzgquZLIM7FWT0GCmaJG0SHRumBiTG04HQmNHxUzy4rPdoSD37LWJSF4BUOnMJcMPllGfRTnsG07+Iy/ksVdF5LyVQy2CY/tha/YEaOLXYhLHyyxU5e+Wg68+EXDN9thhEjSy4Y4EE2+WM0hnUiogo1JNPNQSz0xhzlDWrW+EE0f8CfnGwpQO5cLO/AGjr2PFzHVQDFSaOMF29ub58dnzj46fnxt9A1/61Uv/3XuNH7rS186V1YGet8jcIUi0FeEVyiwXe3eEajHKZ685fpvfejRBz6yde7JVT1oz5rAq0MXGa5BuajVTSJKolrR1SqvilMkfxJ5FK0oUCWbCd6FMgpaJftKzZGkg9+6pMl2M3lTfOCl+MSKNPwI+8krP6OpIOOjeENGeqUniiIeoofaQWkR7IIQ1+Wgxlzo0YtPwOimMAeMLsYRG4q1xuKPeaA1dAO52T6W1fzcoHShN+250IuE/Pw0JraiqA8rOlRYTdDCJ6HKR/uHIxiKuEArefvLSpAPIPKRRyXyUQq9WFuPz+9sj8/ubv69v/GaP/JT/H1wp3Fo6vsegacnAkv/OU+P0W7l6o5AXf/59r/+j191dLTxT48cObZz4ODhFX1DhV5HuqrrgataDOpNnEreK3q/aK20yPPcX1MFgORNUncCFk35WC1XZjCToD3mvaRcU1ST3kr09N6EjrWTxkrg8CBLIsc29gSmATTOGwWrXUXFdUbcp2BZyMyWtyReYDeKGsQocMaa1zgEEMcX81NCaiyM6MRHXoZvkKDTdC0O/WO/05N5ixLCJtueUSBlRDbmPAw9GubvsVgdt9RV6izJXGWPm23gtdtolo+WEQ47NdaHALmgF7BzRnTz3OShxx/8r9Mv/PzP+77f+5lnxIQSVPTWI/C0RaCfGn3aQt0NVQTuvddvCRn/4pv/1a+/6KUvf97G6oHfpaLGXSuTSLC8jlrZUzddkEDZU2BoJFOKGn2NozSJC5y74HFGtrQ5VXBEts7QE/yR9F0AxTaskgR7BWM7UQzRgk7bxrzhXLwwJuGnX3YEfjUX4fQrCiA33swXPfYfebV8pNAy4Xrw2aYLCkyYQYoiTAnHP6STt4o+rPCZiJAR/z97bwJv21WV+e72NLfNTQcBQuhFgkL5ULFEhZLi0RgE9V47bAARQUBAQAgFOaGkR5oAArEAlab8JU8KpVFKFJQgWKKWVS8oCgEkoZP0tznn7O59/2+Osc7aOze+Qkly7z1znrPXnHP0a+y95rfnXM0uoaldHnBecuksICLZkhFkYy/Ql+/IVPHVpBv76OFbRP1DsB3LFKAucdAWZOp5szo3POWRezx6b2P34Edf/sMP+JSfIHPPe24lRqZqqRm4OTJQf33i5shy9XHDDMTgOrn7nZ5y5d9/9t6nzDrfouFTNxXO+nrNZvx+4aw8jW3mqw01DMcAq3HXgzQ/aci4W5bguICmAAN8z0wYoAWgHsAlaDkDkEdrxLcG7dJE0YM4DhSFXwAGNtTzzKdos8W/atnJmWAuaTKpKbjoaGyHWRNI59la+MGHCJhwzLQ9kQy70O3AtVoxYzXwiKmElX0VPUEUHew6QvsRABleROOLgAWIWUSAVEzbk2zup/WZcRKbXhI2cKJccosdYqVfzrAUudgXeI5ZusU5OWImyAUzunFeQDja6K33O898xRN+4k+8SlCfIBPvcq1u7gz4WLm5nVZ/NQNkgBkAN0w/9XVv+7blazb/x769p/WXVndOtUTKMulMy6Qac7sslUpaE0QASX0KYzlLcTkQG1xE47obD94xpCMLOPkeOWkxplP8jFLRPVvzUmIwzA05CUPFnr3Kn5cVRfOyrAZ4g0lLh/AAqxLXvBzxF3nBDbYimAJqASDYSj8NaMHL+IikxJOxoVLuAYxYpYcfaBT7Ut3ej+CIVgDOPORtPnzRNVDak3m9bi4iAYAlt4gghyqxlX/qYofYdX7XDM4F61mimhBuDr52/df+8OXPeexDrFY3NQO3YAbKV7lbMIDqevtmABBkJvDqJ/3UX28s9Z526LBuqVg/rNspNmeaLWj5bFPj89RPHqHWr5VzoYVviWCQZbAHmMqP+gI+5V4/D+riG5A0A2TALiCwBUDlwpYCWBqczediHOTkSjUXvsRgHr7gYwy/vs1DDhOY83wgKuW2hOLTS63Y1MvLoeIXGrMw9qH4xK778muwpc/FN8Tkjwg7oX/5pi7+xAjbnomKUWyW86HOj0TYD/xQHK/7ZRZIbuCVi3xKzrCh//BHg9jwjWzRo9ZlLhYiz34fRPOzVtHny4D63L7CbRJFftTVcuhYV4kOrrrua58d3e22j5GBTl5ARbuWmoFbIgPlS9wt4bn6rBnYygCfw9nTXnTha09e3fekpaUdI91oP+gPhl3NBrUy2tf4rRmhLpxhUGZmVUoBNg/UAoFc1sulujKao6IlPg3KlLlfd/BoX4CCC08SlPBVhn9jQXvTgKNlGPB5IY0CLdfygw2QI0qhFyag4APPMoWWsQMgIttuUXVqGj/Y9RpocVj8RDtjsAGUM5iIgTyVmbDALGi2p3bxmYIF4OGV/UjALzX7XMp8v9ja4rGfcXWsUlF+bJeLY665/sr1jdN2f/erH/9jf52rAum51jUDt0QGckS5JXxXnzUDJQMxsO59zuN+6apD17xHN9oPNzeOaNI10mxCL/1Qq2ctDKzM1FQzU3JN2wNuASVG+JTBrF/iU1LeA3nwoDGAUwMUgGZBhS35ohcgF7F6tigNA6HAixIs0+BDdU077KcfQYi45WX7zARtoPhBt7zSdtbQSx5o2b9YpS662MUf5qyl/aMmLzzn0zRvRDS9pQcXeWLWq8yWwz4zv6BTFz+FJoZ9llzFbS/ypfdNoUyZ3U/1jNn+9Zr1T3YsP9ogyNNj6nlBvwd1c8tmoALhLZv/6p0M6MoS3z/W7U73PvfnDlx96MqPj/S4rc3NI3rozEg/2zRiANbkQjdgqw04einP4MGAz/Iiy5XlyTQepD1gF5ovUrEbAELgxJIjg7T16ZflSWhAU1nWA2hjkA9gKL+gUJb8mOmw1FlmQQU02ZUsBiLxbUs1hokvEElisqM+y7oFRPDlpvdli4a/nJERfyJYAStixpdrg1PZH4OU+s3+EEM4cCX/5Cn1smZmat/mpa+wr6iJ2XzrA6rIFDl/WYn9wZ7ypTQJBPWzW1oS7ej97BzuTZ72iqf/9O/s37+/PkItPyy1vsUzwHFSS83AMZGBXCb7pd9+z+17l13+FyfvPuXWg6WV8WDIMulg1teFMHkBDTM3QMgXaUTNwA6Ngb5ZHtWeGRhzD8VHIGeBRY7hHDqzwiIPHXD1MG8gagyYDtAw8CcQciAlsGK/QIPxr8jjlyKG43GfDv/6IyZiULvYlP2IB+DO2z58gRCALX3AhsJSMbEWb1DwXpY16WUpeUj7koiY7FttbDgfCqPEgiaxFX+Zky29ckUu3jJ3pekvJjI783le/cDgZHO0MbhudOg1r3ruzz9VMmVHEa6lZuAYyEAcncdAJDWEmgFlIMHwia+48NuXD44/sG/XyfsGS6tjXUXKOcOZXhr443ZDAQA32Htc1WisS02dQ89a1IJXAMNDdQELAZxvRAesBGQS8qCPhMHEILkFgiLafhtoChAwoyszIvrFTwEj20UrzmV6JkhfR5vBSCZttRDECTp9OP43NNu9fePDklsbgBJqgjnAmLFsxZvAV2aQGC/yJR50yAcFQMaH42a/Ix5mnLTzKtRiA6Aus0MrE7QKfmVT1aRLrStjNDHcHFy9eegtr37uzz82hAi6KJhQNzUDt2wGFo+tWzaa6r1mQBnIJ888/lW/9V07rj74vr279u0bLgsMNTPUL0zoFsMhg7nGfIGYbhXgTw3XzYOkYzkRma2ZG4N3/twQY/vWx9+zrwaAtmZHBbiAiBzoy1uUugVwCi0BA1Hr0QgfTb+YMWCI6ZqYt5Y8sSVvBuCtGOmzL44kAM+SIecU8Hwc+lu7ZTvEmvpp2yKOLYCSuCBaH5yiWXhbsUgI89ijIf7W/mOA5d+xiNwiwQO1R6o2B9duXv+uVz/vCT8iPRQqCDpTdXMsZaCeIzyW3o0aizPAz+/onOHgTU/7mY+NTz3pwVdff+W1uq1ioNmFfsR8k3NOGnBH+mFfnS/knKHPtel8m2YjPk+oy/oBJdrIMpD7fJ9oviWBusxcuLTfS4wAEbdEiGH5oqMZjwrgaR/N+TnJYMN2inw5z2h1gwSxoOfzZpIzX/rYxVagju0bQNUqMRE7oAJ4QduKvZyDQxc7igt7YZMaPs/wTB38JKBBw762DpKZIDSKdeFhAxqyahfRIgMtz62SJ15pE78l37pNgqfGjEbc/qK3Zn1wzejQ//OaAEHfJlFngs553RxbGci7Y4+tqGo02z4D+kHWKWD4sl95yhfuc87+D21ef93+Qbe/Q3OUkSCi74HaWfL0pLSY0ngcZ8D3lMazl0ymQUDiAAiCruPmc8skMDQ1YFGWG9NGuzaQpKwZTKkoeJcfAx5d+SNMgU+7GEgkG1BjscLfslMAU9QgFfAqMzZk0S40egiloJnqAajFAzM5ANCFGbRESwzSUoc+8lgty67xPdn6AHvJRfkCgBXZEk9AKDPi68ImzQJneoDo1DPB8cHf//LznrD/k7oIChDUaz4BDqRuagZu+QzEUXPLB1IjqBk4WgYAQ73GT/i1t953cNW1v793577TdM5wtLS0PPQ5wF7fT6DhR3nLYM6AXr7fxfjf3H/IYM1Qb0ASEJSLTBJIAItyOBgwADGQAWhQVXTycJFsoFcBIokBEvFUG8DBfwE6ec6tzMhsrLENWCYI4Qug8oUxBO+Q0qd8YFUgnvZMgS0af9jBRtlPxLUMrHsvbUrxlYd0WyJMF3/cWwg1PXnXvD8stQb4yQgzP7uQNEY5Ryhf+qeedWfT8VS3vUDvHZqO3vSa5z3+FxDV+1dBkETUcsxmID/7x2yANbCageac4QVvv8fwK//8zj2re+81GHI16ZJ+uF6/bO+b7gcAm0bzvICm5A1QLHjCQL81O2JEz37yGdxpA5CeOYEgsgcA+d+gwHm6sqwIsHBfnmFE9gxH6KBhcCrAmweZzanTnqF5diVNn/+zbtG3P9sR+AhgDZDSJTZKmdUqPNuDQqx0qGI/Zc/gCF0MzHPBi0GTXKCmrbkhaxCVjK9O1f5S4Bd9+mhJ1+AnEBQYaokaRNVS6EZ/c7TeOdKdvvh15z3xXLQqCJKFWo71DJTP+LEeZY1v22cgwXDt0q/u+so733nx3uVdD9YVpBMBYncwWNLksNxeIdAQvhUwBIw8IyJ7ZdQXMHCBjcDRsxuuDi1gAUh4sNe2zKzUK0TVBfisKxAAVziXlgdPASnAJ+Xg8AJ8ZBjwydkhbQAGsnAbds4KSwjiEaPUSx/1og+AeRYLyMpGmRnai2UkaT/I27blQkfGig6GsYR0yBGEXvYDyCtWZtvMACnlKltmyEUOO5yjhac86ueURloJXR9sCARHO4dPfO2zH/8GeLJJsiznft3UDByjGeBoraVm4LjIQIKhwKX7hOdd8LadveFPDgfLnaWVHZN+b6insflB3Rqw44pSDfT5WDaG/TL6M/iXWZWBktlfABN4sDXjmhTQUWbKrC1mUwEYGuBNJ3HACgdSAU7ALcd+1TQL9qBiHvYyhrLcGPEAbvor2gATgBjn9WTTfmwEr8U0Nb5d0o9tSBp7sqFGYbPfjZ2tdt4+kcBH/F4ulT4+rWNbeFK2fKHMtKsLc2hzAdPw4KHrrumdespjLnjmz/y3tY6WQmfnsQPFcYmubmsGjtkMNMfQMRthDaxmoJWB9lLbE//z65/WP7z5yt079na6/aXxUEul5Yb7ns4bllssgAnPkLRECviUQb6cN8NsAg21OkYXZNw0BgAmxQbyuUSJXc/yABrgQjoU9Ciljz2gRLwwCPiCXAY8dObkBUCyh651rBbnDaWvbimNrwK63q+YcTZ+JGMQdCxlHwqvmCjLvzq3p782EBY68ngTl1i27hfUqrCuGNXtEQJZrYVuMDPsHRod/l+dU/b9xOuf/rOXlifGXFymksVV3dYMHPMZiMPwmI+zBlgzsJWB1pLbE1/8pgd1rj34+l0ru+/S7Q3Gelh3T7ND3Vu/xLQGHNKDu4fSZbmUjzuAUmqDX1jV3NEzwy0gk2RzdNAQMPCvpgHQNnAR5xOxClgFSGHWbfAEnYZuAzbuGVvEUmZv+JFs2OJ2BReRASuWY5Fj2bKAsA0XmRBs7BB841NM9dvgiyfHpIaXZuE6P/iAKTBk6dbnApuLYjQL1OPu9DMgAsGBnhfT0WLo22714w964trZZx/UlxRf2CTtWmoGjqsMcDzUUjNwXGYgZx/Pfu9H9l3z53/55tXu0iMFgJ0l3XyvGeGA385TzSSsq9mi9nFrqZFZFOCXaMdMz1eh+ojwtR8GNoNHZsegxiZAJOgGrkKUPZYc1dGMyrNHZHkBLPYXBFOZYQKgormowUysuDBQAVYl1iJRwIuoQkyyXL0JBSAGLLnQhQKglWaZVXrZV6wC5BIQ03YkyKyvxIdz7nsss8Ke5n5cEKTpH+cCWQrVk2JGg0Pr1693Ttr7S2947uMvxFcuW9OupWbgeMtAOWKOt6hrvDUDkYH2APzzz7vgqd0jR351946TdmoWOO7pB357mh1qNjXzrJCfc2LoF1h5Npg1tEQNwIOZpIGxzMLayS6zPi52ATCwRZM2L0qASwN0RdYgJG6RtaA3CWw+VyigBFS3gIyeXRTZaKPj+E0VX3sF6CLrpVXoAl7HUpDQflMOdpAJCGEukREG40996Qq4lQJWOLktgl+QGOke+o0B51OPbB7+2PB2t37Ca5/yU3+LKduo5wOVilqO1wzoMK6lZuA4z0BrqfQpr/ntex65/MuvXe0v3384WOn0hst6TulACDgQvvVnXDHaU5sBv1yMAijGzFAYkCBojIOuAiAUgAEkSq4Ao2ZZNGZx5Z49ZBCyh6ZdtEIdvpAoZ2bpcxHgCsYUQGuWPG2ozP7sw+6wx//84UwUBm7OSxJ4+CyRFVnssiIKwCki7yvCs5meHKMrQk0Zbaia9DULnMx2r6698bwnv0h2pzkjd0h1UzNwHGdg/sg5jnekhl4zcH+do/qwbr4nEz937iuf2dscPXPn0s7TdJZwppvwp5oVCrsGwgvdhC9Q8K0WBo9yc33JIHDArCzB0XBioAG4DCwCMsALwCvgRW30MDiikbxiky0TJ25IB1yLnm/BII5CsQztckFOOTTDu6hbJZdxbQe7EVeRKPEX7bItIKe2/otskcQONpjMaQKowrnAnAXqWaFaBp3pWaGj6WZnYzr68OC0fc9/w7Me9xG08+HoxVLd1gwc3xkoR8rxvQ81+pqBJgPtq0qf9lvvue11f/epX+1vjn92dWmnzhcuTfpLywIrnT4UFOqKGuGM7zlktigAKrM8wIfzi4AE6AGQMPsrBwuABoAUGEIk+8I0gUq5gV9ESbDEWGaeghqbA0C5/aAslWKxgKLFwx927NdLk7QKuEHFnilFqAAzdIOaA3A8AH3Kood46VOX+NUQR+f/WPoEADWznk05D8gy6OYAnSOjw1+Y7V19/m88/ym/iZ06CyQLtZxoGfAhd6LtVN2fmoH2gP24F/36902vvPZXlzrD+w1032F/IEDsLzMj9LRPM0UhQpkhFoAif+UnnIQOCU9Oqq+sNKYBIgWkygwOsEnwgWOTlgCkCiACaIDslhzWDXQJTuqhy8wRHfOZRUbbl63aCiRmqEWOSKwq7SJbYkvwgww9L+IBAJkGGqz1C/LcEyiCLgrd0G9ZTTqH16/f6K2svOGU/3i/X33xA7/zStTbXzLo11IzcKJkoALhifJO1v24YQY0w1nrnt/VDd6eAj3+Ba991Pjqg89c6i19Kzfia0o47fb0G4fDJWETF9Lo/kOWPH1Dfj6PHugqhwmgk0uiOPOEyqAlKJM25xINeDrpxh996G1ZEbzsCogVcATIYoZpoEJzvngJtYkhLoyx7BbYzYNwxkuM4Bv7UM7/qa9O8a2aC2FkfqwJ4XigC2I665uHxp2VwTv7t73NS9/0lEd9kkjaXyrmI6u9moETIwOLx9yJsVd1L2oGWhloX1n6ytls9e+e9+qfmxxcf+ywO7gXF9T4HOJwZSIw7HMxDWDX1YwQ0BLA6BjhMHHbwFYATIAmOf/UEVebcIMhYsKZgn3uOArkUyfDMh6lCkTjlTaoqZRqa+ZYqFtboI1Szvlx3hETGHEzYoEoale/DjGB4WVQAfQI+wpBc1lmgL1pZ2N05NC033nf8m1u9ao3/PKjP44VA+BFF5X7KCDUUjNwgmYgDrsTdO/qbtUMtDLQBsS12Wxw+fmvffjk6oNP6s26D1ge7hB46IpS3ZSvc4lCPcGcQBFE4bxfV6uoOm8IfoAtBhjPDhv7AGOZrUECJA1MapdniQJWiVJGIcRcyqwRHkunZakUBucmiwqHaepylWtYNugWEOS+Py+Vyi/nIGOGCAxqwZPrh8SXhOep400FN+lpjigAPHxlb3npnf1bnfzGNz3jMZ4B8oi0zpqXQstUVdq11AycyBmoQHgiv7t1346agcWlvse96MLvG3/tqp+fbowevrK0c1evtyQgYZl0qPsm+sLAAegjnOLsnvBDrTJRzFni1vImgFUEBKIFMSW+dc7PgMYSK1RjG/BUrkbFR170UlSFQ6IVoCyzw4REll0p5gF3xZhNcOpPa508Bm0m0JRJZoR6IsxsIiSfdUaTjY6uBP37/o7lt530TXd52ysf84gv2JjM6TwgrwqAkZBabY8MVCDcHu9z3cujZGDx4o8n/Po77rRx+Vd+eHzoyAH9/O99Vpd3ClgGBjauOPUMEQjkfCLAaDjz5FFyvS7gBFSCRuYZEQE8GoAh4FjAjX6RATjhAYKi+YgsoFd0aKMmsPQSLDNN2RARN7rSlSJbnhEW8LM45/4m0phoyjjTEu4mAHhNZ9D9QO+kve+8/XlP+O9r3e66FDvOw3nnYRBDtdQMbLsM+LDbdntdd7hmoJUBgMBLgXFRzUWzWf8PX/Dr3zu59uAjZhuTB2hR9G46l7jsWyp8lWZvqlsvpr4nEQgTFoJFmjkKclgW1a0Ysyk4BVl8lit14YxgibYuUHFtIJOEqF5K1c84uA0dRARYsYcDbYV3vrjFF/RAB1Qtw9SP2R+Ap6e/WFq+RuN1xTH+6qw3+5vB7tX3DG59xh9e+JQf+wyqlHoOsOShbmsGfMjVNNQM1AwoAzqFtv/Agd7FF2/9esLapZcuffF9f3HPzauu+f7JofWHzsazbxn2l04ZaPkUCBPs6aWZVLfHDftaihRqsYSaaObE5vlBgJBZXFl5BBSztOlceMOsDxtltpdLn0z+OM8H2Veo+lyfuo6EB2Jr1qcYpp/uLg0/2tu59Ic773Srj7zusT/+xfSzpoAv3X9R95a204MAAEAASURBVOKLD5S11WTUumZgG2egAuE2fvPrrt94BjxLFFv13PmyJ77l3Wce/sw/3Xu6vvE908Pr3zHrDu4225ycsbyyQ5CoGaFmePkbiEAWEKb7FjVBBCsBNpH4V2GGWVoF6DgY4yHcLHFaRgpMBcE+4SLSyGomqJdufu+Mp5vrvUH/Mj0J+++Wdu+8pLtrx8fO+p77Xbr2gLMPFgNlW2d/7WzUds3AfAYqEM7no/ZqBm6QgRsDRQR/+rfedcrqFVff7fC1199zcujINw+Wlu66efDQnTvjzimDpeFezRaX9chvgaPuU2fhU7NAZnrlilOB2rTM/rDlGaCWQ321qICTWZ8BTwDamY2v168/XNNfXvqi8PPTmjB+auVW+y6dLg0vvfezHvO5p3S7G9jIspZXftZzf5mSWtcM3GgGKhDeaGoqo2bgKBnQ7Gzt/PO7l156qZYXt5ZQ25I/+9a3ruzbeftTDn/lq2ccuuILp06uX7/dcNfePZoNntoZj26lE3pLPdnRxZxDzQC9Ptrv98e6dVFPuu5Me8PBoW5/cMX48JHr9MN//7zz9JO+sveMM7/aOWnpS6868OCr2r622mu9/fvv0T377E/O1ir4baWltmoGagZqBmoGbuIMAIy62IZ7FFl+vIm9pfkuvvDJkmkSa10zUDPwr8tAPYj+dXmrWjUD/3IGmpnjPXSMXWzZsy8+26cEtWxZTg0exYJ4zTF56f5L3T777NCrM72jZKySagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBo7DDHSPw5hryDUDx1wGZrOZj6Xzz+80x9Q97nFx0ybgT35y/+zrCfzSS+f1O/s7nbPDxnnndWyr2+1+XTa/Hv9VtmZgu2Rg7kDdLjtd97Nm4OvJQBvkGnC7uNPZf/H+aTmAjgUwmnXX1s7vXnrpPbptwFwDMCtYfj1vd5XdhhmoQLgN3/S6y0fPAICXMzoAjxnc2lp3enTpLerabK13+iU/tPfI4fVdm9cfObW33l8eH9zc2Zl2z+gOh8uzzqDf6/d3TqaTk2aTzmpvOlqadXrDyUizx54mdPIQ0ztVk8ms2x1pprcplL1OnOtm0/FGZzQaT8ab/7y0d/XqyXA2Wjp55bqVU3df3e8euv7p//7fH9mK5sZba2uzHrPMs8/+5GztvPPKTLKC5I0nrHK2TQYqEG6bt7ruaGYgAS9nd/sPMLM7+qzuotlF/c+8b8ee3uGTTl/qLp+xeWh829mRzTN73eHtpt3hGbPp4JTuZHrybDw7pdsfLk+ns93TWXfY7w66/f5qZzbrhdtuZwr00O+qDfipP9NfT0fhZDIWX1Hobya0hIOMUbIzsexkutnhNZ1NJpI63JmNDk/Go0Pd5cEXFf6hfn96+XS0+c+95dllvZ1LX+n2Z5d3Otd86dSHnnHN08+8MbDcmkk2AFnBkcTXso0yUIFwG73Z23VX28B3Y6AH4F3+J7e79exLG2f2e3vuMt4Yf3Nnc3DnTm/p9rPJ7MzZqHNqt7e6MhguCbiWhVP9znhSwGrW6Qu0aE8MXhO1BXJakuxPoQOF4wBBSYnXV0hj4WEBRIOeQFBEn2AsW2Gz+ujPZiDiVPK97nQy6XU9Se11ejIsBwZS+D3NLnvC82lnpAnkRmc6OSzi6JreYHBFZ7r5he7S+LO9nYN/6B659u8Htx7800nfte+KX7n7/a4/2udi//6L+tANjmtrhuSjyVVazcCJkIEKhCfCu1j3YS4DAN/FF1/sqdiBAweYXs2VtY+/f8/K53bfsbsxuPdwPLz7bDa883TUvcNgsHLb8Wh66+Xh7l5HYMdsbiJtgG1sJOsJknpCqJ5cCNAEgAK07nQ2kH2BlGhTLWxOPQvk0ErXA9kwkBkssQeXGV+vhw0BqHQAxxnELvZKmcmGxDuzyYaAUNgkedvVJFFAKxo+CU71TCgIms7G2vdJVy0ZnWhhtt/pD0jHSPbXtU8HtWo7vq7XmV4x7Y8+1+9OLusMRv+wfNrg/+2uXPvJlz/6wJfDfVOtra1pWfUeZVm1AmOTl9o4MTJQgfDEeB+39V4AfJzbY6nzaMB3wfs/frvNq2bfMhsNvrM36t1rOls6uzft3X4w3L086O0SgPQ5Mxegp1lapz8Za7rX7w9ZoOxOp1ornGkiphkcF4dOxgJBrWECPP3eQCujzNy0tAmG9Ya2xSyPYhATg2VP0zwLBK8ANMBRPE/+ZNP6krKq/ExEAO+Mb+jLqdvQBWPyWYrimgoMFZwmjQZpbBOCtLUd413YjWE564zZEZ22BL4nssr+bHTGm1cJZydf7Q6m/9AZjP92uHP6F/0do//5rU+61z8+unvH9XDmKoHx4ov2sxOOuM2v7ZqB4ykDHF211Awcdxngwo8bu6Dl1979P87sHpzdZ7YxvN901PnO7mzp7r3ejlMG/Z0as5e0bCiQASfAr85ALQ4Dzeg8aRtoVBc0MBVkxiemZJlndXtai5yIXkANIAKkBCsCUSwYZqaFXpBHNPHAogn4Y+Ary6jWYAZpcJJIAqStYKOcF8SnQM7UEqdiA4VlTXuBooIjXmaMomqWyMySUmRQBTiF2gqm+JE9dkgo3O2MmfGKKbTvbPR0vpIFWAGicHVyqDOZHdycdTYuG+7ofKI/2PjY0mn9P7/9ww996ulnHpi7QIel1HqO0Wmvm+MwAxwrtdQMHBcZSPBbnPW95I/+aO/sn/f8X8P17gNm4+Xv6UwH9xr2d57U7+7SID8wUE2mPcHcgCmTQKDPsqEBL4HEsCLQCkjTccFS4qwz0kSrgIe6ovqcnUFNMATEaBNYJh6YKhATXfatIIwxINGHNNZsUkurbgNGBZCKfNGRzdAtGsWOl2KN1FoOVWhlaVYruLCtSOz4kjJgqG8ATFs9IcS39wjg1QxQe65VU5GYGbLMK9AV2HLO0dPG2Ug05rsT7bqSJfmB0tfRrHE0+tq4Nxj/w2B58rHBrs6Hd54++ugrHvfwzxJGlrXOWq+z1un4ytQ6W8y01PoYzoCPo2M4vhraNs/AjYHfyy766L0713W/rzfZcd9OZ/htneny3ZaG+zTADzVY65zeRNOt7lCvPmgADGiuw2yMXlkG1dRHgMiMCgAA0DgcACdogIXOtGnSZXhRHyssY7IUCo8NOpw/pC+zdsVss4ChCPr3CqcgyrM/XKgQR1Fy1zFAwIRnmpLHnwyqrympanGsAzAjx6a01fCVpgJGeMTqWSDqWv8kFey+xKachxSfYoyyrERYl9UME+QTiGqjLHBRjuiKSv9jnQIlGeMBF+UMNZGeTQ8prQevmvU2/rrb2/zE8r7JR874D0uXrN33obrto5S6hJqZqPWxnIE4LI/lEGts2y0DjMFc7NKe+XGv3urvPPDbOgeH/3dntPTg7mx4n2XdTNfp7DTwaTFPc5j+pN8f6NydZnwM8wCbwQIAMEYEQEHmo+8hnmFeTJY4LWcd+PR9a4OUATNBiUEKkPMLmmZRXvYUDTsGSfjwZBM5xyFfgCpexSo0O+bdbYOxetKhAIsJdNjoC9NZavUs09O3smbL8qlEo7BPAj457/pCHAKQY6IHJA2qZe9REqWRtxH0JF2WhonUeyCW1pMRsC3Omk40kTSt39cyaq+zLh2dYxwc+XRvefNDy3tm7zvrvjsuOfeBD7xSei6AIg3VGK6lZuCYyQAf7lpqBm7xDCT4tW9vgPaSd/z5fWaHhz/QGy39wGw6vPfK0qk9Xeyi4ZkLXHpe59MFKhpguWqTjzNTn4AF6TOMUxjymWmBGYBU4gYA4+VOyXjIF8+gJ1PUyPmuPYFW6oFfAAvnBqnRL7M+bAA2ogrN0AMMR8gBMCAc/8jICDUEANfA5V7IyC66RQId0aNAp0ACqKkLDQX0DW8LPBSsFQq0SRWxMOvTV4mwWwwCrihoZ8T1Fa3qs7AsBJS7jIhlVDGmGxIa8zVE51KZdV4r89d/cbAy/uDq7sm7b/294w+tPeCR1+CV0pxTrKBYElK3t2gG8qN/iwZRnW/fDLD0yd63n+Dyond98G69K3f90HRz+RHd8fDbV1Zu3ZtMlwrw9Ia6EqSvC1s0DwLV/AlmWKbBDKpMqDyGiwS4FY7aWtZkzIZn4AIwxMx+AgyAx+zNwChZgIqSYGfb8jXWKTaDpWTCvcESYGQp0rdcyH4BG8BSLS0rMqniOk5NWT2jxB6+ZFJArZj4Mwhb0yDn/QsgdTAKlnsGy37jg5miavlrAM0mt2ykOjK48467UfRst9kAgLw11CrYjttBdEO/SV2dRdTMULnalF8JiN7tGBi1jLqpd2fSK+cWAcVrPz9Y2fzD1X2ji+977jUffXT30c1VqIBivfrUKa2bWygDOiRqqRm4eTMgMLrB0uevvvsDZ/a+susHuqMdD+7Mlu6/vHTqnsl4uaNrSzQeLwn8dDXnDOwDWQA0VeCgiickOV7ziWZMBhqEDGq67WVJ8QA5gADQKGBY7PhcYNAMdJKBNgoQLMAkW5IB6Jj5GSxlD5tyZ19pE7+mq4ZTbBK3dCVPfIUuoKIpiukAJKBidrTxiUERDXINokGLIj1EAEdml8UhVgsw2gVGrVt6vvleekjZroQdp2/ML/lrTFms7Gi511EEC+uiHOlrXqxdI1nsHEDOlavOkq7PGfX6Xb08U7xK9zQe+ZvucP0D+86Yvfd1z/rBj0rQpc4SMxO1vrkzUI6Im9tr9bctM3C02d8Lf+vDD5gdWv2J3nj1B5eGp57W7e3ujDa5707gp4U2QYEvjeRmco+7EASAtAEOLvOnZsgFCnR2TLktMyWDB0igYhnVDPi0DWLJU50zO/PEp9iHeNS8kGnzsU9flWdwqPm8In29KBmn+wIhZqWlANIFbOgbvFQDlGX2BxUJ9grt0oKKrGedZAcCcmrgCznyA81FVQJjfHGwj6In/QBGpMmNtWQIfqGFf3WIDT/mFWeicT6SBVOBIEus8cQcfwvBBucWdY+jRaajaWey0e/pmQT9nh4VN/nyZLC8ccnKSZtvP+s79r577ZwHfM0xa37NA8TrucSSjbq96TPAZ7qWmoGbNAMXXXRRv33u7+Uf+OjpRy7rHuiPVx/VnSx/59LSaQIQnffTjexa9tRoq8egaG2RYZcLOzXy6g+A0GANCAb4EDSDNcCRYIFMgkICFTWDfC5xogeoJfiNNHnhQEAPWeSwwytlDIDqUwBR18iAfir2FTrWLeQmVgOcvBQAQ08xa58MPjErQ6UsdRbAISoujFEOmni4YhP7BQLZ67JESvBkIQuAa0CE5EyW2SRxlByyx8UP+92oqs0+JTAXBsS2bMk3euUmfQyUC3cAxbJEigr3XBKhLqzR7RwsrfJVRcDIRpPGw4MBs8/eQcle+eWlXeu/u+/M3lte/7Rz/loGXeqyaWai1jdlBvgE11Iz8A3PgAbc7gFd+Xlx6xFnL3jbR+7VvXbpsZ3x0o8sD08/YzZbFdDoPrbOUCeXBj1N9TSO8tgwBn4P2F2Djj6lDLoGNM92NKRqKPUYT+Rq0NdIa5DywK4u8vASpHI2ZyCA7uG46NDmlBj1WMBoVW3aQKiQfO8gtV9SoaADeHBNDPQsvpZGfeLBjqpGjzZxwWvr4Bhc9MwVPi+wRXWWtGOgE9Es5GC4Zwn7g1JArRhIABW1AGWolOVY6Tmo0JFT6xJEgDU+2F+7Qlct3iuKz2+KaTCHptsvvIyqmLyf3HSpG/gdnR4errOm4muWaJAc94d93dyvWeJwZf2/7zxt/Obvef6V79s6l7jWW1urV5w60XXzDc/A1uf5G266GtyOGVgEwDfNPjH86ps3HzY9NHxUZ7LysB0rZ6xsbPKx09Jnbyjs0xWfGm0HAyYXDKpi6RoMBtgCAGU5kTmIpoce5pHJVxn8Y7ZnLZ3XY4anNmM6QNqWQQ+69eWqmd0FmPmcpOgM9hQAjJfBLnSh24bqnJ3CN9ixayrpo/S2/LED+KZQGSBoS99tEW1CG4uFbO4DelnCVXab/YTQ8NQwmLJRYX6GLfMhZRumZApQqhntZgkWfb0tjsNtG/O+8L6U/ZJM2PP5WYRJBKYR0QyRfdc8l7ZmiSxkc+M/5xnpc6/ipmaJXHTDrRjX/+1wdf3tZ963e9FLD5zzTzakm/UrIJZM1O03LgP6eNZSM/BvzwAA2L73702f+MSOL//V+v7ZweVfHPT2fftgsE8XvgwEZsuaEvQ1x9HsTyMoC30MkrqagqGyDP4Kx2OowIFhs1DLIOxxlbFV0oBP0xcp26gl0HmmlnIhY1ALGjq5ZGp7KGNbdEASVwAcduAnz33kYvYI3T5RUKGyjBoFBEz2JuUAegp9F2rZ0b9pzkHoY5A+Bfls25FoTV8yZbnVot7AOxotzPkLRwkeGMR4GFQS/OVDDgtAqoYnkWwQS9ous8fC95Lpghy6ZbbI7RUks7iaTtaRVOFJNzydYKyfbtzQR0IPsenp/sTZl766suPIO06+R//C1z3+nL8vshUQSx7q9huRgTwWvhG2qo3tmAGNbPtbS6BrH//4nt5fTR413Vh+6lL/1LvOZrsFJFwdsaqbsFn31Aood2BrNNXA6LGTgZcBldHQy2vqMDvMUgbQACIRkfNLG4OT+gbBUDDQIRN8eLQT2BBj5sdY7NmeeHjLtvVFoyTNtkRLW+gSYvqHn/6sGPsE3+ARfWTcRz5o3hkp5X6ibxkbam2kk7mS6g1kFnWQsT8AF79F3Q2DcMYiOkyL4SOL2rn86tjYF5+jtGX51xuIPF9nuAhIPE4BUgA8pHKWabMKBh1mmRaM95grTM1ncZmLbniyjdqaLepODd2OMVkfDPob0vnK4eHqkbeddMfp6y98+iP+N+a1WFpniCURdftvyIA/q/8G/aq6TTOwuAT6kk/80d6Nv9z1mPGhwZN3LJ1xx9lsh2496E76g1XN9vgNID0WRd/3y7kotfTJA0y8rOYcMu/b+jgCQAzWSWlATCMmgyYDPAWg0RzCgzhnoJCHxXk+isW0sRw2RWMcxn7yWEqlmBY8+vhAZo4OTUbMCxu0EyDRQ8ky4ucOpC14jiHkDDDttvguCFFa/SQ1O1kkLIOdLLTbfejJdh0dqkaOuEwQMWJs/CSQEot1S4PZY9ERUTvIPrqvnfe7WchNfP7yYJ824vffTFzaJ0umnFdkVsiFNQZFcZVdHvE2OaJl043OZPTF8eqe9f+698zNV1/4rB+OC2sqICpRtfwrM1A+kf9K5aq2PTOwX1eB5kUwa+95z6nTz53yk73Rzics9U/+pumMnzUajHv9Jf3UHuDXL0tnZXQ17nlCEJ88D4AaaJlBMLyWAbHUoBuDJ0DEAJw8so4NwC114NGGljwTpGcQZJlTAgzU2INGQdZ98QFSZNKX/QYfMgV+2rds0OBDZ7eo6eOL+E0MGgx4WZB3nw2dqDIOE2QDYMVeARpTm/2xH+nP8ekHgFka3aJWbKid/SCXfhDTFnF41od8i4cOIbOxrJrsN4vdJlgRvpTUbvaHvpTQMU1efT5Rtc0DhBjl1zcQZIbo56PqNgyeLzcbTbjadNgf6T380qbOIb5j962OvOmtz/+Rv5BhP7Gm3pxPJmr5ejLgz97Xo1Blt28GuA8wnwCz9sX37Bj/7q7HzTb2PHXH4Iw7zDq6AnQ2YAaoC2C4yF/joUZFw1uMcSx7MiP0sznjk2fwoO1RT+Mfgz4ppk9Dgzk0Bs4EpmCbzkwxz7XlLJARNWeQaY8+dIAJGn4TsCyjPucKc4BOGr7yHCLh8Mp+xkyc0CnU7A769heMLSAQnRKCBspCKYppIGkhm2RsGxShq2OQgtgq7IOLlLLZ0ILgCj4Nvbzfsf/uQ24DKf22Lu0Iyk3aKinjtjYF7GjAhKriNx1SGIEX+iUQ9EQwDRDl6lK+pjBb3NBHise5zQyIA92kP5lcPl3ZefAdp9+599LXP/3hl+Ki3nZBFmr5P81AfjT/T+Wr3DbMQAFAhqUyNzj3tR96VOfwyvNXl25z105nrxhLumNat7xrFsgtEDzrWX8SRqUkDBCEMuX5m8z0xEpwyBpx/RvEcjBm+DOdWsUA1gJG+laSeQMlQqJBp4/tBD5EKVzgYju0QwZ/gBI6adO6yEjRAIoB5OiHMeuLTF8snyKjhm0ZZNVm4/2mKR8U96NtZWSRwwAlDLkPL0ktmeQ18m6Easg19tDP4KJNNwHPvvXeLIJrE0400l5jisDwBXC2C/RWST1/SRDdl0ppJ5kRwnO+kEdPfeS4h9K/viGmrzY1IPKtZqyfUNwUHG4KEA9phsgPI1+xvnLS+oV3+I7ZS1/24z/4RUwZEC8+gEItNQM3moH4aN8ovzK2cwa4EOaA7gWMgeT5b/yT759ev+P8QffU7+71TtFgNdQS6LJuf+gL/DTX43u6RlFdE+r7qpsLI/QpY0BLYGKcyysNPePTMAWNgTAHQwZBBkeDm+rkpRxviwEqdODTR48XchRmb/altkEOHjrqU2dMqYsOPNuhoWLb0su2dUu3AU3024M5OimfgJY0O+DIAzgiHgvHpgEUfCK3UPDTFPzGFwuT1cd1yjSiaiS/4QF6kiWuhhaG233sYdQXzlghhMwo/sgxxXqie9YKP+jou0s/9st+rSQenXjIQKOCDkq8qNSB5xkiJ6k1U5xqhjgVIOrTNZlpybTf1e8Fd7905c5T1l/+3T+z/vpfPPvAQXQrIJKFWm4sA/mZuzF+pW/TDMydB3zLH3/b5pWrv9Kf7TmwNLyNwENLoMNVDXqa52kU1gxQg49HK2Gfh6oyAKpZnqBCLVIM2KTU0mwk4yVJten6RTtf4mMxAUtN8+jjKukpDyBZRhvAjOVS5CAnuHlwVX9Ol37MG1JWpAKuxKI2cTQgG4RFv+hkST+uiQGdli3HRV8vpy0VcURBnqK++cjGfjuYwvXWDwlIniiedaKHettei5b+k28xNovx2EP5QhHNOZuEiQ3rNwIlBseFPdGR8yYFTQgFtUsXsGNBvRCgua99yzwBiCWXerd1D6IvsNEvYnSm62puCB03BIiH9P3sy3+3esrGi9/xonPers+lTK3pWXDnMf0srsJ1rWoG8iNZM1Ez4Ay0zwO++L3v3XfwH/ec29nY8+SV5TOXJ9P+rD/cobug+7oOxhjo0UqDoD5HLHly87ta6nk4U90Ah6wzeOUIRBseJWdTDJqAovuiGyAXPqHmoxd0bKQP9BIoEDEPcCMe/Om1CH4ZBzH7YhkpSsyyboQeuhQq7wcNYoAfOuqVEv4yllBtYnNfm5z5Yc85I+go9CnJa9rQ9DJb+aLjtjbU8MqmBVzBg2Wh8IOPfOHHbGyKn/7TGbYzXtou0kEtZbNO/6lLnboG6NDx+xzGqJJXdsjLC2WfFFwTH3J6yaLkCYCdETRyCwbPOdW0kqfVTMZH9MyiDT2s9mo9svZLf7bvrNG5bz73h/2A7zo7dALrppWB5jPdotXmdszAwjLouRf86U/PDq28YMfKWWdNJst6CMzKuNdb8n2AGvBm8bDr7nDIwCSCRiougmF2yKDFoAhAUNoDHjQGxZx9wUceGV4xyrmyvuyYLz1qXpS0mSAEHZBrfCKfclnLFn5TjjisL0Hs2Y9qx04/bGAo+YzMjoMgkKGmqAGQih2bQst4sy4ChYfoYkl7BhU6GFSNPjTTIUXf+iFn36hEI33STRrybrf1Qz71kcnlZHynLny7SvkkoEBBFiClpJ4VCin3pRiRbBHb2pfQQcVLxqmmCRznlr3qYGYwVHnFgR3VS1LS80U1Xd2Qr/YR3Zi/qRXo9X5nesVsZfehC8/6nv7ayw887MtY0EO9dfHXmpRq2e4ZiI/0dk/D9t7/uWXQt3/wHqMv73rFsHOrh3Q6uzX5Wx3rIhimgJrysaSkf50DZBjrMwM0pXyM1OT8oAt0XhTGqWyj7pFHNWx/oZe67ZgQdOToI6NXAh6dHOB9U7z6DNQJaFbRBl3blDOAL0dd+O6HTVVb9sX0mAqt3ZY+en5pg7+MwcBbdt8xtHn4tByKIZN6dN12Y95mxpoA5H2WnBf0wo7UHZBl0ga05EecaathBb85R5u6qaeaZnbRI05m6963yKX9sl8qTQziAYS5jxjBDn3bbBlNGfPTRtjDpvnJbGwAdl4o9XthsESG90e65qmh6aG+l2mGOFkXV+3Jui+o6ff0KLfuF7605/SNc9/2oof/pjRV6nJpycP23vIxqmW7ZkCzwLXzO/q5m+70WZf83u7eX5789P7G7mcuL525czodTnrDJZ0F5GHY/CKE/vVp0UCn6R//pV+GuAI6HgSbQUk0BkY+YQxHmokxznms0waQYnCFADBBL4NZkUWn6YtPaWTUgNeAo3jM9HIQNjiJZiBEryVrmxhSMV/t9uwUV7lEh5ht0WAfMk51KdiCXnYqKmh6UZlHTUlatNt6JonvXNFRwTb9rNk320g58fy1ZEEOGdsJeRuLDaFSzE89+hDpSyd9QqINr01Leu5PXiST+5q26Fsv3rs2P+0drU679qNNvpfIUpxzbQC90mnTo22fBRDLfYgjPbz9iAjjuKDm6s5g+avv23ObI2tv+U8/8gm06nJpyd123cbHa7vu/vbd7/Ys8D+96U8fNL1m5YLV4e2/aTRZ0cOOV7khvq9JoMZaoSWfEk4BetSDIhDTBFFVDEwFVJAzqMGIcSoHMM/CRAd8KPSTZ0Bi8AodD35qJ/DYkdiopn3HEP5sU0z4CW4eMEOHdg6oyNBP8KPvNv7UUTUnm/skcglDMhkfBGwho6oUaFvNppPx5D5bJmTx2dBFa+ylIexBB9wo0KXUzOpaNJroY5Pi+AIU00fS/XYiGD6hZ/AJvLaTxsTOftbIRzhmtkQt6/0W0b4RXCzwWjTk+NKU/pv8hm72M05UobE0X3xwu0URNliqUy6m0WxwqlsuZjy2bX3WnR7uz6afn+w8+fAL3/mKc16gi2kmBsOL9vMDi0eLtBVlbZ5oGWh/Bk+0fav7c7QMtM4FvlSzwGs+vu+F3dHJT15dvq0uM+CB2APdDs8sUDfDa+mTp4Nipvy+ncYHjTYMPBQGK0CEbo4cgAQDLGNRgh0G2he++BceUBDDg5iaaSCBzgOibNm2NinnMQ4iKqrdTzuSjzGwATcMgLFzNfZattOGxRDGXstW+qa2TNQpl93CtasiJxvsB3wPrcoXdkUyzQ3aEjCNmkYW+uhgIIr52ZdsittGdpIuuaTf4OpN2UO8iS/tZx3g6W7aCx5VE2fGAo0XVxAnjRoiRW107E9t4vKKAKzsJz/kUxe+bVJnwS569C3A53ILDCEDiPq4ywy14HCiS4hnm+X+w5nuPxwd0dWl13c6gys+cfpZsyddeO7Dtp5OU+89JIXbpuTHdNvs8Hbe0flZ4B8/aHzVrgtWl27/TZPpymywtHMqANSvhzMaaeTocSdYGbgYvRhUuDXCA484AB7nA5srLWGgqhfgmOCCHIasR60GYJcE6AmY8Oh7xqWakoDVtoec/cgObcuhywuddhuZIuKYkgcp/WAbGeK0H9VtW+o2Ao7VhLArRXSIByPYyULb5DYxmarxYT0JGSCpQwexhk+Hksywhy4yFNqLfeRNE9+zP9VpU+Kl0GjZMDH0mjcO2yFO5XbQsI++Py2ph1C7ncpBy5gRsz7i8ExgU9oibRV16KcpM4Jge/DdyIB4XwoIeilfPPP1mLapfzKEq0s3BI5HJpodDmaTyyc7Tj30ome8/Iz/fJ/ufUZ1qXQr9duhNfe52g47vF33MQ/stUs/tOvIHwye1x+d9CzuCez0Vkbd/tKg39eV5vxGropmIfpcxDdsZgYarQxo8Wlpz+6cT9E9M7R2GbBM1yZneM0YJVoCUC5JIpsA5HbMMokCPftGRi/6uHHthjqSQ4YuhbbBSe0Uac/wUmbOFkQV+wq/8DMGDNl+1G6jkHTaUaxHGzsEnQWl9kwLOjTJUdKmuy164c4LhEphqePzheolvT2ThOZXNrDdsp9gVIwVXtKauqVi1XCUANvoRiP15vwsCGECW1lsMuw2ehJoQhUv82maNs1+hlDJvToCQd9e4T0vTH/GYGm11Pcf6lJUPZ1G7/mRMbPDQf+wFkQuv+Tk2x956n95ziP/irjqlaX57pzYdX7sTuy93MZ7174v8Hlv/vB3bXxt9cKdw7PuOR6XWWBXs8A+j0TTSMrgpXFCX6OZ+fEL8QUAcyzJb/1lWNkCOdLLAMTsMMd5Bh1o+ndptw2AwZvjR6cBRfXBEcApS9pJWjO4SQB1PtCpb1npQqcN07NRNSEmjTrjdQ6ibxlkVSxbmrbX8GTTIBQ6AIOaTUk97BpkxWnzoVPacrRNxlYIW05t80InaQkGqdN2AC3fN+RDtbzX+IFgIaKIPnS9kUn2si68fHPFSB6+bMPKhR7NuVihtQs63pewmX1k3OY9xw+OVPL9jm4hxlYhlHhoRGlyqEb5SS8xgw+PtmpdUcrDu3l+6UizQ92MPzk06Ey/MN558sHz3vlrD38R5vJLZJiu1QmYgaN9rk7A3dyeu9ReCn3Oa/702bODu1+wvHTWcNbjYphlLYNyU/xsFpfG6yZAPg6MDmzV1SAFaHmgjYEJnoFGojnLyoGroZdBxqMTA1ijw9sQ+tCiC6kZ6KAZMGTfuhBUHBOC+FVtfdV57x7h2ZCqBMK2vtnIW3BLFpO2Ff5U2Yx9oKSS/nKwRid90cyCHDLp33SEMapiP6rTh4mL/ZDPnCJDm9KYSgMNoXHRyKYCIJji1Niibkp0EuySmT4tJz/ZT93sNyG07CIDnWL5VIIQCpYJu3O2QjH12zY8G2zZamyEWZsPm851GlFdmnyqWelQX2+Say5/9qPaOHe4IfrGZLJ5SD8cdn2nt/zFD5x5n+4vvPrRD/lcvc2C7J64pfWxOnF3ctvtma4QyNsi1i56362PfO7UC1d7tz1nMt3Z6S/tmvD7SMJASem5oHExTE7l8gdxGSRypsEgkktS4IgHGY9C5SIYAJMr/Rj1LKuNwUB19q3DGyEZAMogJWbOoOgnL2UbXfSiWE7tBJs5WdlAh5J8t7GtAg15f+iJww5UB78wikzGg17qWCx0GlkLFL8M6BkPgSCKL+qjlgUZx7UoGMTGjnTSTwJIWyVpaSvjgW4bEVT2myBlxDqNYvGTcmnHvkIm5VMFHvLOV4uYurzX8J2bFj9IxX/EZz8Zqzt6n7Af7YYPTUT7aOuKDo3PrT9jEVQ5TwjT/6Uuy6g6d5hXlh7RacT1aUfnDjudz3113+3WH/vWtYe/F591qZQsnHhl7nN14u3e9tuj9lLouW/88H+cXrXzN1aW73jWdKYb4wfLxkCfC+Sd19Uv/GASV9blCAMAeLCKwSUBJQczMurzfjQ0mCQfWgNqDDLwwlaCimmi4zpBSF2PxZhjpANPG19hBwXso0eBT8gMctbXhpjbsz3sI59861i7EDNuSCmDguVkN+muw/6cjbaA2thgQ43ftHU0WgMGViqxp3zGnDZSP0xSuRBLXnVpp6IaEKj1chw02BfV9qkmxbp2UGStYEbIhYGoGl3bl+G05Zq+vggdbbZmZ7FBNu1lvLDS1pxsdlCIQsytbpKtn58DbFkuHDkHkoSWxW1vWP5X8WdILcCQitstuM1iekTNjcl08+Cg2/liZ3nXNS/54VcfOe9A98Dm/dc+NPjw2gPi55zTcq2P5wwc7bN1PO/Pto69vRT67Fdd8oLO4X3PW17SBTH9nWOdC9R9EVoY0lIoA5dujyhHvipum8qZIKONQSQGFYOYssqgAT0HFWoDHcunXJUueT5MlqHWACNWo5N0DzYYC3nbU9t86VB7cMR+2HE/2pZHn8EXGeTVtV3V2YZOcaVN8k0LXgK0BUMYln1QH4UGiZIypVe2DRgQhAoyjscdbdTJ+Nxo0VMWevs+utx3B4NySwdZcpwl47WOHRV/6aut7i8tSjCfhXZB5gY+RbQ5OcgvO+ggB/1oBZ5z5KAkJz9zNPGxxX5ZDv6iIXQXiNm1TsqHncXu0WQdDh+sSCgzRGzZhGp/Jkzkly10I/74sG7CP6TvHIf1O2Of/8Rt/t36j7328Y/8TD1vmNk+Mer8rJwYe7ON9yIPzBd/5CP7rv3z/tuWB3d82HSyOuvrtohuV7dLBQDqiPeN8b5VPkYZBoIEFM+q4lPBoAEvX4gzUNCnoJOAwyCXwGJ7uVSKvmQTJKxv7S07dO1DtW1Ev6HLgGcd2Ap75iHnQU11EqDxClmTWzrsg3nsB8xWgZ7F+0U/cxG8tgyyJh9FDrVQaRoNEASzzYeHQtKoIXnZWbHS9iYZ0bVNtcmDbYTcnDyyIhC76W0Z2hQx8jxh2kygMi/0i3CxZzUMZtCtNs3Fgt2MA55BGN3WPpkuOeeZeAWQGXejG34W1FBtSvpvv1/tdhOzNcqqSHPeUM/MlVMV/SCwftVCt1ioOqJfAD40nHU+/5W9dzzymN8895z3o1qXSpuUH9eN/Lwc1zuxrYNnXdPvYnf2nDd+8LsmV+19+46lO9xp2uGCmJU+j4ABBMs9f2Up1PnyqFQyxwDhQUJ2EgAS4LJGknYOJm4HmCSNgYnSgFmrnfQcvKTqsNNO9tMW8hToDFrQbZ99Db+wKG1/9JFLO+2aNuq2EzLZVteM1CU9ub/NAGyhLdvRdXU0OzAcrpjUbBrAgtBWavfbbdToU1ry2UwW7Dm5YLRNGdjCDHSLMCNMY2p6xtfq575TW14ybkgm/aUMLErS3W42oYZeyyeuHIs2+V5ZPxmqs5mg2DJZmC2wzNgaJQnnl6WGBw2jFBsvs0K38Qctlkr1o8Dcia8T6ht6MM36eDq+ftCZXd5Z2Xfdc3/n5T9Qryp1Eo//DR/JWo7TDHA+UKOODtvu7NzXfvRRk6/t++PlwV3uNOnsHvUGO/q6M6I7GAgpGcS4QJTzgdpXPUPKgzwAwgwQGoOEZ4PqQGcwMBAgnzTR3VYfvv6bPnT0uccwdbGT8tTIJ4/BKf2wrFqCUB3NlIeOTpZsJ5/aAxw2VJLvuqUHzwMsudDLaqFjH4onxZOPziIwpJ20lf7cxwev8JE0n8uDIQdJa9op2zift4HB9r6kvn04mJDnSMYHVRzV0bXPBEH42V7MO/KZ17SFfPqkTVnsNzkQj33N2ObkMJ4BOflY2iKVXsu2ZFPc9tTBDzTTg5m+2KeGl8aiTn0fKcgtvAA9HhbhvJnHr6hw+xAvPWRJnV5veTYYrA4GS3snne6ZndG1t3/hjz79D97+0r//vd38cDUrMgtua/c4ygCfnVqOwwy0zwf+yiv+7IKl6e2fPOvs49ciJoPBkGtBeTqMDmQO+/IrEYwAHgRF8Q/WxqCVgEUaclAD1ND0wKgBCLoHIuk08jmgwZMuj07jA2W9ADp7D75BK9r2FRt0MUCd/oPUzPbaduZkrIz0VjHAEkjw2vJILfpBHvtZUj5r6LTTVWMagvJxtBlH6jhud7Z82E7bmPyX0b34cSiyi8P0lfvf9LGpsmjfMUuI95m29wtfKG5VDc980edmqimHPnFkCTup4/jwI36Yb9ruJxE+bQQp0YZmkjbmt+huRr8olS0k9L2foed20M2njeGQIxd89gBCyNAtFzIQM2/kgVOEZUZIXXTV17dInTecbHATvq4qPayrSnXPYe+z//t2376+/zWP/cFP3f/+uojmw/UiGlJ8vBV/Ho63oLd7vAmCL/nEH+29+oOrbx127/DIWWfPVD+aq2+y3B6oI1nvLLfIa1nU6eJZofmNFwLHugcHyRnYAK4i6m/1DdhFsmFBo3gWGbL00bMttU3WxmNJu087dFzzyQs9+h4UQy8HMNNacZXRK2yHLVlxcZcN+x120i4CHuAsWQZB7wpyQbNMq4Nv5yNseaDGTkueDv05P8kPQarY1QzfSsGeBwhshT46WwotRvAtKJDKwT3jS3bb5yKvkbGTyIcc55ekJggJhog/OwZ8ERp7uXPIpcNsR+3cqE1JcWSzTU3H+timnyVsYqOJTbx2vtHFhvVSPwjIUfJLQcqaHbYdiwgp29S8+cwUWUXRsVPOH2qFVAfBdKp7Dicbam9oqVTnDaefvvKUO48P/JfnPPRP6v2GJefH29afn+Mt6O0cb14U8+x3fPBOk8/v+v0dw7ucPdatEdwgr59L6va1FEp+WAplIdTPBxWF2ZqX6FrJAwwANwaDBD4+EAYANRI8DID0ZSflaeOoXXugQQZGq6QcJMuL0IjQwHbwUsa26KhYNhS8nKeYo7vFi/iKhvgSEKkAdPIgiN6OLwd36yFHUpBTadrprGUHXs40ivQNt44hdbARdqNq9oF+uqCRQIFFy2qTsbRlabf7yFMMKuEP/lwJBcvMMYpe2lvUc0zE1tI5qg34Esp9t3xLKZsRXsta2EYgctC2M2eviDSxYMsljDZxNYwtftqBEuJuNKJNA7I6+sAZBAFDKaMPgwtp9KO/AkQ9nk3nDSfjz012n3bwSW97yTlvtDefu+drSi3HQwbaCx/HQ7zbOsYEQV8U87k9f7YyuNvZk+6uUX+4Wn44t1wZ2uV3ZKZxmMcXW35FohQNNBydACNPjQHYXIvIAMJsD50ERs750UeGFwMBMv4dcLX1bxp0kd0vjlp2Qg+byHsEQ5eXuvYVyo436MlHyHLUvBgseVHBoFBHGxn2BZMUs7QBTLDflJALUxb0IGqFYsPKLX/o4hM5/PDlIr9gNHYaB6WBrF/opq0QTh3Tk9+qbQF/zP7cKbXNaEOobdtpB2HPosQnTvrm0aZggCrojWwhl1S2ZDKnjR14wU+abbR0bIp++Exx6E1bjYwhiewrKg47+Og0pVEuuvi1jRzNpIiI95c6FZEjj1E38arfnNtEmJcKZxWQ5bajcs5QP0at46icbx+o1kOa+iuDvs4b9vp37K9fc5s3/MQz3vsCK+t7KFeUul03x3wG4i0/5uPc3gHq22U+KebZr/3Qj06v3febw8FZK9wf2B/4/kBN/Xz0ayk0vrnqaM7BKweUBLS8B6+MNGWgBNzaxQApmscFHc4JYgYSDKokLf2YJh59i7TaDDQpb+WQsazaDDjWEdP2qKONPG2DHnLqWNabVjttJJ065IuBMKSqodNWadtr+tDFkIk5fhNr+LF82xeEKMhmwVaWxmYSQj+7rkVLubZPt+Gl7QVdk9s8GbPsolzIUGVsjU0CECPNNPlr2UpzizolWTfiM+xSIYeuc4yvxtkW7Wh+Cao9Q94KsuUz/eCjuIIyV9Jd7jv7k7Fb0ARI+uPUAkz+9eJUg6aFXirV80q5qnQ63tRj2TrX9vqrn3/z77zqYT+Hjfzyant1c8xmID8Lx2yA2z6w1hLLs1794af0Dp/+ml7vtnpK/s6Jnpbti2L4tsq1oT4H6MO2XBWagwwjgUGIAzvbNNXmoIbMhhkf/KQ1AwQ8QFE8XoBh/uI8qpScaTU6hextm+Y2DtMP7SgmB90DDu0AaDXLTFBCjb2w0+hnvyWTfspOhqSNyU4qYjs71HyPTxs3Ipu5sxHJhFjJaX6pEBG7yKazxo9ItkGtFyVDaOSDQGUadcilTJvXxCJiqEpaOtof+xURvbQFr4kPOQgqtlmac7Jtn8ym7CMcmYftVI46feV+p42khxs7t382LZuLejZrwbIfjh8jQUM3TbT3zSItGfoR4tZ7D5HSMEqz8SG6oE8vGYIoT9xdwdIDN99Pp+uzyebBaW92Xb87/Owff/MPbfzI2gMeeU0FQ2f1mN7kR+OYDnLbBtcCwV95xSXndzdv/fxu7/ROf7hTzwvt6aoYHYS8g1rD4Xh00QiTTfpQ6S/W8AAvBqQESWrsteVzVMkZI+5YFsVg6iJjXZEpbV/I254bNj8PmtCjWA7lkIVMl43rJIQO8k1py4ifANrw1UC8Md3q0JyzFX0P1mJGWkSdL4s6yUWvbdM+0x9CtKO0yUnLuok1CaozJpMA7Bbophh6Li0DczQxib2hqY9dxy26efFlIOlN8jCMbigTPyVtJT1pybcQcggu6HuJshEo/KbbGC507EFq+5mTlYDjl1C+P8jyyr7lkQtbqZ/7zWcHH/DZtOWQ4ZxhmR8KAyWre+5NFEj65vvJ+KDuwtcVpf3L/ucd7js+52WPeujlFQwzy8dmzce9lmMwAz6/4HsEO51nvOySl/dHZz6/2z1VP6C7Wz+gqzmgFmM4utkAgmAmL8CNA5cjOc/jAWJJ5yCHT59Czcv3/6nvAx1a6kSdA4NBELnQVdXYclsbeNihpP223zY/5bIuyltxFCtl2wx+MtDIh0D7vCEk4l0sDQ19MbFBTcnBEsWmLTp25wZqC7MpcqU1v7VdOyj0jLWJHzJ+dPQ1MQWtaITtiKXNsq1QMtjPGViwFztnETYt2aR5XxVHOw/sb54HxXfjM4WCRtf6CKnQ9r6XbtlKyPuNTTtFsOVPXexYz42ixjZtQ0YI9cW40LPZ0LWOCOnLPNSRg44tSsjkOUP6zbleeMoJeYCWdKtB6+tYUyBciMaDKnz+sK9vo7rEtDdY7faHuwSCe/R8trve+3MfW/7As97+/tvVew2d9WN2o7e1lmMtA/nYJr5hPutlH33bcHbnn5zOdk8Hw9VOT08MBfZ4NqhulvdKFN9PGSgMbjQZFHhno92AkECNQmUZySGKnJc6Uw8ZM4ocsnQBRwaTtG96yDX+w55l1J6riall1zEir5JyN2ibu7VJn5jK/XMz4mrbabTSb0vGAyX7RTw2VqSzT2JhJRu6daBBpGCPZIY+VerDbpSj3fDSVuqL39gmxxpcXdJ5dO0naOHSPkxKgjoZHzZNZoMQBVr2zRQteBlD+mn6Vgw59FNFepYJGmKYsllv1G4IcEN+wR9fNkK8yFiw0LwvR7NhydgEP21k3Oiapo3bdFq23E1a0qmPVkTPvKZdHYeiyYAOFvP03um41MFZ7jecTg6PO+NDg2nnsi/c+pvXH/zapzz0k/Vew6Ml95an8TGo5RjKQILgh2Zrg99/0fe/a+fgbueMp/rppOGK1kI1RfQkMI5v3j0d9Ry7fmmTgwCzQGgUDlJeCW7QcnmTdtKpfZCXY7sc3NAQUvHBLl4Cq2nmyAaAoJL6KKFHPLbfspNy1FnQS130XGxgvu0YgkTV6IRS6pIat1v0pC3aKIG2jNpw6LfIqd8iWZV8OO8h0PbblnW7ZQSdNpBmHC2RLYBANvbFvqKNzWyiZ5tJiD40f4mJPkYzbyI1BpCzrPTTVsbUyMFQocIN8jQSvDMXpovVLqFalMWwqo0UKftfVBCfWJmVtUQtZXvaeF+wFw6cJxsPWsjw/QIbLmEs43c3dODP+VLHNotmw/R7J0kunEHAMpbVXRW+FHuzO9HtFbPRQd3U9NkvnXKPww9741Me+jd1mTQTeezUvPW1HCMZSBB85Rf+fPWf3jp+90r/rg+a9feO+75HUAs1Xg7Vwc0qTHzV9tNcWu8iAMeSDgMfBzN92LQ5cAElDv4ELnbdPG0MhCGXdNfiIdO0syM7HO9eXhLTg61o7UHDoi39tNEEZatFp2W28Rds2yTutm2EUsd2tXFaYsRry6acTBQdCHRUcgDL/qIf+Is0G1mMp5hrbFpHvXAzT8dmjsxqEw4FnUXb6buxkzJbok181rehYC621W/bafwRgOKxaWJrhDAwX8yy4IKcaEHemgli1wohG/1GDtPqOMfh5mi+oaFKCXOloy2fd5h8F/MyJp/9EGrLNvsqYvs9RSZ59iECNH8uVLuI4RhUN/SGVs4V5tVcrK4IHP2dVb/y29VTaMZTgeF0etm1p97l+ke88ZnnfLiCYSb22Kg5FGs5BjKQIMhM8Atvnf7ujuHdHzTt7hn19eBspoIBgjwjzecEJ/oWalBT7By8tAE9DtJsm69+3guoZsOnDT9fzXlEGCrYacu4HzxGCesBghYu/fSduog3bezlK+ihaj/NwIVMMqJGz82oSy/k1EmyY/EIVnxZzsSIM2Q96KWelN0POYylP+trY1Y6mSNmp1VLGHvpo8W5YZMBG39wQqftu23HMbDhhQLyOnoNAmq39cQNo26V+EuzxMZRj51WIf/4sx1q8dJmxpF1o5s2okael7ts9EKHkrVp6qcfC4dOY98aRcd6YYN99YAVdlPescJDjo6EaKZuymEWNhv4rt1QE4baloWnknppy7rq5DlD7s21DylyryFfTjlv6Pelp4yq3e8vzfqDnYPe0m59ob3T3is/vef3fuFV7//ues6w5PhY2cbH4FgJZ3vGkY9MW5t9aOXaFw7fs9K72wOnvT06cJb06xEcXjPduMsRRn7KEQtwcUB65sfBqZfBTHQOToDK0qqz3dSSKbaCJxnEcyCznjaeNeJTzLRJF3VoKQ8vSGVAKd25bSMrKr5cwnbTDzKyNqkN7SymQ4NwNJm2fOrZULFgW9AZTZNfWDdYomQwQz7920zbPoS0QZ28Fr3Ji/gtcnhsVaHfojRN9CjpqukEI/n5fqZg5gr5xThso6Vv92koHKWOZbERDehzsQSvbSNlraIO/XY87WSkbOYbnaS53e4EsyHJ6ZweDGiqHQ+2aNNplaSFuGXcDqVsp1yjGnYac02jSPh4wVl8q5vqm6nOIXJCX58vzQy1TDrZvG4wm35ufe+ZVz/iN577iA/Uc4ZNdm/RBkNCLbdgBpgJXnzgwGRtdtGSQPD3Vvp3eeC0u3vc6Q41E9R1aH5aTDm0JzqwfD6Cg1sx5yyO5cn2rz4knQMT8OMFjWPUwCldlkk9QLR5apuGfdrkJWra1mnRiIpRK31YHn6URqfFyJkfevaFrPhNu+27ZSeac5Xto1tMuEFIlIyt7EShNXQpmA8Bfb3yW37SMx7spa02LfU8aodTvow0/jGN7dBnv+f0RXdBIZUgoEBRDZmubahOUeLxK3iqSkld9QCI3Jdk536Yl0Rkaaej7AcJVtqxSPrIGoEo7B+y3s/kU2cbueh7X5AVKXWShlgW51BCGQP0xlz6Es1L4tRhM+WanIsOL30lXyTvP59hGvQp9off0i3bELYdUfx+hwAVnyHPDHU5G19fubpUx68fctHTzLDX3zHoL++ZdHt3XLnmn076b4972fu/j4d0s0zadlPbN38G5t7nm9/99vaYy6EX/OMFy5f913v//urg7g8ad3aO9GiKQW/g84AeAsql2hoANJrmAevBwJsyMDQAFymFxSAAPWeLIW66eSJQe3AIecsEPUeBlM0Pi2UkT7+RV5tCv01PGnW7YNMlFdRJW8G5QdXowFkMBlrYmrMTwVhX7WYgTL+q4XngC5ttPykfZvBieTeibd0kqE5Z28F2zC4zPkTTbtnpeZm2PYdJjKGDbruYLkKzD2rHbpQGApQIilgwZvmIy/LJV22byKCmfvLpQ+TzlPYfSx0yAABAAElEQVTafuGbh9xCae+TDYtvGrZsGEKh2WbwYVkuZYpYobVkSrAiRHHM2WnVja0FgTl6yxequY8OVbx2TPAso+OMx6/5OFS7FGaCvumeWheB64usnkIznRzSOUNdTTq57OBJdzn8kAuf8ZBL7r+mX65Yq79ckZm7ueuFj8PN7X4b+wPVyhUvnae98JJ3L3fv+oPj2e7RYLgy0LGl52freGNZVAePDzYdqdScl/DB5qOxzMZ4Ez3ja6XTgKk+sgwwrtXEBqoNOLbswPDBjly86GMLveSJdNQ+Ar6STnVbFnkbjOoGvGTj9P+nWORfkGtY2cDZYhEv2Q2rRfOgKIbz3giUPnnLHCJHXqmt07KBWubMeREvZczThr7jgId8MCwXBGhuRoO2S9NQz4pBDno7dmYqTV98Zk9pt2hpC51O8sIOJMdTWObTh20bIUfF56QBSfWbuJBHmEJblXNDg1cUd7XJvDGLTt/wGrraGYNVYUaxfPhKl45JHfoNP3Rst01v2ckYszYrjOa+uqtN2vVxBzEYPnbiqlJ+35edmIz1sO4ZV5MeGkymn/nyrb5143sv+IUH/WO9gCaSfwtUrY/QLeB9u7psgeAvv+Qjb+mP7/zoaUdXhw5W+51YDtX9SL4y1M8OVZ58gGUdR29+8eRA5cDjYhkKfZNafQ7UXB5l8LGOhYss9m02dNoyi7ZCrchnB7+0sxAcsw+KGHM8OjhTaeIoXQ8oGX+IFBkHVwYc22obDJ7thZ25qi3bYsyR1fHAK37LnKXbMdIml5bBQAi3bS3qe+dTp+W/GJ+34QFVJL5QZHtRpemHzew7hojPtBsEUiRtN2OHFG3EF0tDaxpbEg0pGw5AfPWTZOl2P321BZKGcNCTHawGaJKfdom9nSf0Uidl0pb7rY3poYAN9MombIrQ2Aoj+f7bjBVaBlFHB3ry1PGXUH24/KW2PTPkatIxt1ZcdsVt7nXwP7zy5x/2DxUM5/N5c/Xi7b253FU/JQMecmdPe/FHXjGc3OGXp519E/2ifI8ZIHNAHdmaLcaRpCYHlnFF75bBDpbagBfnB/Mbv8FSdOT9whmyVKrhN/RC3pINOewiQ3Hd6psWG0RydtTQaVDwE7UHLtlwgZi8IMEiG1aIOv1Cs6o2thc6cxWM1A8zaQs7jX60G/FoNKr0KVZQ3epnPszPTRqiH+2Ua/tM8cZPErJu+TGp1W/reF9EMC38JT9p1E38bftmzLMaN2EkwSRMW7tNYx+zbzehVwIqzub8h89FvQyrUVdjTi8Dk2D6ozZ5IYYmDmT1aqk2uunfNhAIwbZPtzFGCT75zuOqRbaTuXiCme99BuFYIiBfLENbH3Q9mxQn3HOvR7Pp4TPjQ+OZwHDa+cdP3/l7D93/hQfOuaKCIUm9eUt+Z795vW5jb2trM+W8O3vay/7s+YPxmb88me2d6Ffle4BfgmDzY7o6KjlufOwoZ8zoONDo+35dZg2x7JVLo3kRDIdbtuFxvyE0H+jwwo5p9OOFbdr2qUGhOcBFy5IDVMZlXTYqyEez2KSPb2oYDDStkSdl27S0Dw2QTBmr0YlXxmb7IlPSNHWzTCd507WxbTomlDqb6jW2zRcDH4v8tJF0wiEm+qYFA7ncF4M9cu2CYsrYSOlbRH1I3kc1bBIaRErUzTInAhYy13zLtmio5CukCkEyaTfjhd/Q1G7TMZK2GxlstHQyvrmYJEM42CIftG2rrQc9XrAp2KXMxVBI3hJDI9OSw/4NdCRo/6HvGNRGP8+fwnKbOl65H6aHkm2rTd34abcxpOLvtejoIpq4zYJjvcOPh+rHtAe94e5Rb3anu1z20dU/eMa73nU6t1Zw/YCV6+ZmycDgZvFSnTgDfNNbW+tOnvqyD/1i5/Ctzp/2Tpr1hru481aHidZLVfzwbL4t+uiCWg4y6gacZC0Bi4Ewl0SZNnJAUyyrDn3L0k6maDl44May0PRi40HKERU5yBzH8P1iEwT3abdK+snBIfuIzLXVtypGsqht82JYNvw4QymTNAtu5acYkxD81EeHvgr2otnU9gEd+SI2t/U+pF7IpA7y1sOoO6Vu+0mbFgmZbKfPxo4a2c4gkCXY1HHXxLI/lgu7bucmdLKbtfeHTupQfx0l982xS9ehaHM0M/Dm6OrQh97oieB2xpAC2Q8jTdxJx0YoNnWL1zgSDZPEnecKIVgVRsKNhbZsHtVUK1B80sWuc6JO5gYGvCyYNhhKYBa/eO+nBWuZdNoZ6j7D2bDT2T2aje/6LV/800/9rpZQv4+hQAab6wjSVq1vmgzkx+CmsV6tNhlY01VhfNP75Vd98BGzg6e+rtM9raNvgiyD6hHawh4dpQAaICSi9TiwAKk2kHG+AToiyefApg2ZOmeH1gsaBs1XnXQInmUGDxkKMyxk3C5Vo9vQxE97bojhuET0IOH9KDJhoowOZddMyma4KvsEMRmhmANd+skaeuq6HR2rJ6NxXuJqHIcPV207KS99eJnXJDc1zNDzQUQ/iuMNPm2zsNeWkZJDTD9t3TRkgdAXLfWd5+jbPgG0bDdJwU6LnnHkPqUdy4uZ8bR1MEGJUEoMGFqMGyHRmxgRCRlYaaDhh8HsOzbkogE7RGyziRWZKElLGynv2LATtrJp+eyotl4rjrSX9i0acrQBUmoKNarY4JVtGPAoyWOJ1b60KTQd4TKmlR8d/OL1dNN9f8ew09sx7k3vcr+feuYf/VYY4OKaNGdS3dw0GahJvmnyOmc11/yf9oY//o7R5Xv+ZLh0l516Qv1EPyqo3xPkZnkdOzpCJqCP6uaAlRUOsAQlOvQp1Al4SYCWB7PBLoTn7ImWMugJ88r95dAh6BPB+Qsf0GqnLDUHcWPLwihEUd+2kIEUfOtkHx5CqvXvkmaaPoTshAxd/M6xTAwB+FtNdxq/0JOZdrPf0rFt8b1/yV+QT5kMpJFdkLNZaGmn5afhwRbfqqFPboibYlU7LDL2tWAz99Gnk0OvaGsbsm2VtN2Ov6GFos2krYjfflrtdh8124hY3Q9bxMxAnyVjaWo1Uq1Na9oLihlrw1ej8Z2y1AhElfaTAKvRSUPQiFPCyFPCRPN+JC359P3+SRBZXz0cNuA1hmiilLZtoFwJzq0VnD/kalIVPaBUv2c4OqSZ4NX93upnXvHbL33IM6WIh7ZbrNfyDc5A62P6DbZczTkDfmqMZoLP+O0P3HHzil3vGg7vvFPLoeNZlx/V1adf7wCg5SXRONL51PNihmgQpNYgCYbQN51OlJwlcsDxsk7w1LUtaujUFLeDmX6sG4NxHtxFumx9QMNII8kMu2aFTVhuwqMRhV1EjgKddtOHGB1XNgBRRQTTtGnMmdCwzViUyX7aRbqtn23LqRNvQROHrcPUyzImbBlp5KGHXAqm7UX6VgDFGHlwLsKB8xXKkGg2vqOR/axtqd1J5wvytg0t+VljINvUemUX1tHeN+hNCZuuQhed3Dfk0l7W0Bbl23K0XaTQznPOkdI29vIVGo1d7Df5DyHrQaePgIOAUIpJSQ9ao9OS8VKr+pgx4KvhOKUbrlyj0pxbFI9lUvj47XLTvX5UTTffa0hY6faGOzRP3DMZH77dM3763Pf8kiRmfJFGvJabLgMVCG+63HbyqTGv/+qHdq1/ete7lod3vm13sEtPjRnodnmWQzlg1PJBV5ZNDFDqG8x0tBgAVfvAoo4X4OUZYQBiA2baH2RSD9Moc3ENdR7Q0NU9aoHOi4O6kbOhYLS0sGehpCEXsuibzSZKq2n79JOWLhCFhj62zDcBjgrteJmXtJCfsxNybZrthk76oOsi+ZwdpI8SgLgYSYdhsN2d84F4EiIGdFPeecNc8FJUpC09iOLnjI+uX9lAmEKfksZLb26brLboYnz0Uw6bll2g+fMjoZRDJvflX3KYenMy6qBvPy2G+/ho+cFf+qSRsSMzp6/OYjzw/WoaxZnthb7brRjchBiM9EcNAKY8Jl2gpWzSkhVCwrxGl8cH9/TGAok8gUYXzxgM9Wxhfs9Qkvs6m1ef8urHveh9P1CfS7qQ0JugG2/RTWC5mmwy8OS1j757qBvmeXSanh866PZ5BpOWR/j4s9VB4WNIm5zoNUAoKz7A9E6xdIacX8jq5cEriKmL45SlTUEkC/byoGWEyHb64UORS5jo2McCDfqcURNuuGn7bX/YoNtPS2WxD6uhpQLEltHc/4bdKBRl9imBBD3PJlIfWUoqw1e3TTZ/QcY0CWXeLJ/9tI0QjDSoOruwGjJ0G4BaCrws5iWhZcD7hdCCbuot1nN2knkjukcli2h6E/iWb+iOJ79WL+xTvkft/Wy3ScZcfyE++130j3s7Vr3gdy7E1EubUbf92b7oqYdImx8qpjV5T/mwj64NhLDlIr60Cy31qSmuteFUoJ9NygU0WivVbxlO9IsV/cn4sutP/ab/j713D9Ztzcr61lp77X3O2efS3UJzh8YYFSVqDJRSZVlJpDRAxEuSthDL8m6XIHhBBS+xd2NESFOlYEQhZVka1AptSCyg7Ra1MVCWF7QkqUZNFBMtG0Hspu/77L0ueX7PO57xjTnX2ofudP911nr3nvMd4xnPeMY75/fOb35zfpf1rl/4J7/8C38gb7GszNv1R3MPZAp9NDVvtbQH1tckjo6+/I9+z9fcOfo0/WrM/fOjk3t3tNLJTu8L6GOh9LwmzFchcsvTtzql4avDOniuw9jR4LT97SKetXIw1zHXV4n2FaffHJBWKoyDWA1OxrF50iUAJzoyaVMzYyipjnVN8S1RhEhaqFZgtGyLRSIoPFqbeOF+z41kNXh9Ehz51jPBtLWqeNMyCKINlolupRJiHH0brHAIxMID9nidsHBiXopLaDZv5xDofJEGPFO2tkjmjZomvETyPuQxZGDpU3/4bOw+d+436vrxsKFVcvf9CEUw89zbTxFqqWcBS90KUeEnbMkJ0drlzCF5+4Wbr4DryQmePHLy3ihzoXEFfDu1chm7v0YBQa/W+Ik2/7V7rU5Onrmj26R64fzpz7/zXzz/l772+7/7Fbdfq8gj9NHv9Qjcto/2HuATog/0u4G/441/64sv3/PJf/Ho+OMvj+8+pydIfjZmHbLr90P1KlDFeRB8BchA5MCIz0GXE9HKhHTAYtPngLS99xHieFMX7fDowaHMK0Fwt8rNs0xcYhzD0UMjLRx651UwnLkttnlJJrL5EVEPvzXAI4BNS0Lw6cue7ko4YPHdh1ig3WBTuwe0yb7iJHUGpkwPLISX0EXLT6YyvK/IiVjyr+mnZPI7bw6wtOZj4lxxnFf1+so6tTywNRSbSkrNklzMcjaYIq0dverN25F9AlG8SrpQKPQTR6Y1OrCw5EAYIZ+gmMfJCy/7JDjaM7H3KziaOqAn1jUQkIMeS2vIdl2BvirE4YsT+iANf8tQbxaeHZ+/5/T47j//jj//9Z/7yyhjImfQ2/ZR2wO3b8J+1HblEuL2xTd90y89/4r/8Ts/64PveNX/dnLyKXf1i/O68PPfl+d9Qb0bsA4zXRX6oMD1saGVDxRJtS+bqz6eCMB80oEHh9WS6jxc8+qAnBxzCcKpfmJOXOG1pqZ4mychYRkv/OjMq6ApbSEGxTIbOvLDtREOYOJlJ7V23UhMpPpoDNeQdPqKUDF0dlRnsD1dAwILY0i7Likx9XO4TQ04dUbOk8yktQ5EHBYFe5zgP0GrlGZ17hAP1tyK+fEfYw9v7kBTozW5dc8pmqEcBqLtCF/BjsfIdlYscI+hhSq3CBteaXiuorPjIGEMnLgBVpr7uaILLi2Gyz4xT3b3ZWQOdR3hxhBU8/4UBj2c5fFmiUUc1buH4pyc6Jg/Pzp/6mf8x5/7X979ge/91r919AaOtu9hGLfto7QHapp+lNRuuIw/HKNPiP7e7/quT/jAv3zV/6wPxzyj7wqe6XfpT7gS5Orv/JyT37ol6t2lKe8PvdQBxgHjRWTfDq3pDuYjR71fNJaP7Vjt++Qfjs7SU5xYTqRFX+8lokXzkTl6TGHWD2fU820fniiYRRUPDSla+vnE3VjFqWENZ9SKOphF9vODbGO7IolBn/sC3w2N0sk2RsKCccIJHTwxsMT3vWK0Qe1yK3IITo5jaA0wJn3KmFcrMOPXBeEoMRqV4s5YBbIdjY2EyHYdxdinvY9DIGfk2ZxYCWTupM+Yomc5rVqq8g5AZYgw5fd60U0/ub0jpe16IVWf/ZGaHotXW2IgawwhjuvWiGZ6jg3qFr+3Gz8YJhydIXOr1N8x5EM0d+7qB2ju63OlL1yevefVf/A3fvV3/Xq98XJx+0lS7bSPYquH4qOoeCt19KWv/9+/6/Typ3/B5Z0XHh+fPH2Xv83JpNfPK+nFr/4x63VUcWDl4OLAnr7f+6tHZ57szA+3eiciWT5pzbMhv7T88ATDKTsHK2frAUW6MeePVQ5wPzEJd5kay6BZNE8CcK8ZTtOJzTEkkBpJbl7IRcSd+sATs04RuBpxesTSV4I7YV3b5CpEVzqIbEJOXOHOTVrVAM/+Syh95xS3pkxvSK6ieFwzhOTSv5Q2cetR307xy97sLDC18OiznbNucPoea/LUuynoHAn0uCvRuEi9Pwpwp5W3p2S4Ssv+aT65xLWi9xjZPpxg8nM1BjUNrfn1h9TixdmT6lhfAsinebsrgF7ev2cw88Ui/OgSi+2efC3+OhW9vmN4oT9CenH2UH/B6T0n5+f/8v2v/hnv/qxv+JLP/2e88NbCefi2fYR7gNcrt+2jsAfyCu3Lv+Ztv+fk/DVfwIdjLo/0CdGTdd7TLQ//fBpnRCZ8zffVl+8rvVwJakz4uVpkiDkhmofAaDmYODDDC5ZnBr9/UTnEOHD7iQS9vWb0J09Y55CinK5TEvbzDEEdcjLTyhfU++BgLC4Js0a49Bazsa1bkDtOEuSrO7ThEPOYiGLQEq9+vnDo7QtH9B4fWOGWKj81Ojd1Rq3WOEgQXS0DLO3q1njl2IeD3cEkq69YxjYi25wal7uys09ws7hEaqkPdeqCwfN4bCzfnAo6FiIBeDRhPUcWsmoUl44299lCDuvU7v1RSclFMOUOWaVZAXckdNLVmtEwTSs/1uqpa7tOoNi+hSof7tTE9rYQKDs6/Zuk5PmP/PLdinsnfP/49M5rnn3nP3/mW7/t8u8845Mgbyzeto94D+Tp6SMWuskC+Vjzl33j3/iFj97zijdeHD2vI+Bpbu/7CpBPiPpKUDM+J6mc4HjViD1f1nGgcVBdt+RK0bHiRZO8vAolzgHWWrj4pSt32fS1kIu9aeET4IBVZ+2Bg7HQ3MNloQmIGThj77w2Fjf6+/H6iWNJbkVdqGqXFhqYbjKSy2BiZzyh0bu2etemN0ggDsAoD14tubh7bV/BScz4CJKzySNWjdoZawQ9HgcOeR4rOkmkx6l6DYdgkcO2zfqpQx88aVMnsWBwrvCEVSkHZ7y3C06NE82pY35h4YMx32nBlrd815vbN7SBXavyXU82eEEbzWDwnEt+FYsWbvaFryoNrDoZn/WjIQc8+di5SvXYrE+U6ro1qrcJ+Rukd05P9UnSp/TVK32S9OjTP/vNv/8DX7+ob4B82z7CPXB7IvwId2DeF/wDf/VvfPyLP/zc/3Tn9DX6vvzz58cnp9q3fl9QJ8T1niBTm4OGEx8tPr1PQjJsV58DlQOfFGI+WDDUHF/m8lnrsPCBiUbxDIPLSE5C+Gi6pZcDZrww87WiT6zjI2/qAGcxzsoCCw829cJ3PQgF0NHca5WcxIn17Tac0bLNhpSLdg1jpUdcOLqu3QNYQt7WZa44Nnnhl9/jIiSN5EXTfuWREg2gPBb0FPG4sRVsHQtV2tQRzTmra37yCO9blVmwB7BnWDJD3Gx3xtsZAGmx1btGjTlhb1+c9NdxCttvQ/J7/5SGcQ9sAU7XKnzQ5siGmqESi9MSyqU2i7XobSwuJsdm4iOE2mqIjSXbEl1Csy4n0xVb7xf6r1X4b9PwxftTnRCfuXNxef/i4uEnfslv+uq3/sbb9wvXbv5I17cnwo9wD+Ye/bu+/96fuXfnJ7/m6ORZ/Xza+g1RDozNrVABfjWr2c+JLzYHF4tPeCupDw67FedonH7brpPVSnUMCIM+Z1LZPvjAEhuYTOOJ4W+acohdd0MmTwjw+wDH0EKpYOmr/ArioFugOZUTOzoWW3StV4PDkvyC3SUWLPsi9em7BnY5wXq7ipg445jawa2rFT3jMR4x/AzkJeqSE725X0h2funvY5amsJr3BbzyN4UXxWv05nvDI2STfCTMK61IpjchiQ0KwPaAd/nCQ+vxCYBqesVdO8Spk1pP6pMTvco1He2Ks49DTS38HX1xKtAx+c6vHlL0opXh+QQnBxxO8ohzRTivCh3XMzMnQUbHJ0n5PWI1/QzbPf1/Vs7HHD380fvf8GXf+B0/5/b7hezFj6zdngg/gv2X9wV/2x/5m195cvGpv+Ls8pkz/V0lfVmQ2SthZq5mPg4nOf0XVAW15/tgKcyc4vWJUnTyzFXvk+fAZLZO9MY5j3CfcBmTtYyulccjMLqgYCxwr7Qaa271ZXsyRsJF8bg6v8QSA3fuBIIlqXKinQFlO61BjpacmHdyDmZ7emAiGRt1qlQQ97OOa5e4OyVscgAngF+L4RFDN822/GA+SSsPStOGVueBNWFtz0yKHmPwft4IHnJ3Mj0O15lB5VsTbDTPg2hXT7celMMQjQHv8i1VWMtgDIztyn4y/xBuvd7eLrSYdkfNnguEhU/6oK1kraObE5XHFaL61pPQftvwk59C7aeCOByv6Dp/atrmHZY6GfqvVRxzi/Tk6PT+2enpT37ux/+f57/lbZdv0/eW9aGZ2/cLs1c/7P72RPhh77KVwC/H8ErsK7/lLZ959t5XvP784gXdtriv42X7viCzm4ONAyALCpx4/N7gDodLjAWbhZbc9MYKx85BTbxc93a1Mh6xRVnx8HXQdZOdvMZiDF6bO11clo4Pu6kx9sRRh1Bo8wmIJwwv4c6+ioaDgHWGWMZ1ZV8VN3Jo0MJb3sF3OBw/mx1iq2hlVCz52TEMKduVWok1F0NElxnbANw5UCwGen1LauZB6OlTNx9YaXwvp0DHyrbPAGtfkEId8B43GIHZijMDvR2KTUlyM3a2e2p1DpwsZXgfle1OK3o37Dw2O81QGATjoLknR0swxPS/m2MEi9CPUflcGYZPzEuy8UmtHpjHwxp6xcF7hXza4ERnRv0m6SknQ/1q1c/7C3/o8R+A+9pf9abb53N2xP+Pxn6/bR/uHuCVl2bkt11+273v/v2f+LdPTz7jc47uPH9+cucpfd9Hh4JmLncxuErxizT6qkFvW6vYOZB9VVY4dOP1CIVDTx4HRzCOnradyKp49GiQVG3nSkxhPSH4gIMzCMPsms0Tlbp7TpVxlzgOB7XH6Q0QoB7TTw6qb5uxQGY1hcGGnzBw+N4noRlUTH2PF238SppXkR4XeJpJckoH+AqnuI1nfOkr3t01eOQTch8wiQnG/xB674voKL8lwMrvfYxe4Xtp8rqVEy275bQd8qhjUwRT5czHw3nkjPodF9zxyoeaOCnk4RsrjZljPisagfAN1KoS3GlVroNda5cHXuVWT1IBnI0wmRe+ksRGFxBbfXQhFmwsJ2ZzxPULYggAEuHPNp3r90gvzy+PLy5evDx78d36asX/e/TcJ7/z8/7MV33+W/PBPerctg99D9y+gvjQ91Uz88rrb77hY7767smnf87l8X39RYl7dRJk8mqSis0t0TzZ5urPIjX5+8Qnvz+xWQeY87CJaaHRldmY8cTV+3iBJ9vHplfLh0szHZyl2jwwu4hiGT+0KuMM9CfQcpMkinUr6BxnH1aEgm/GcKAc6gztMfR+gpkpsVtz1HFsCAzZpK0xVYAuY2xCGcGpg2T65RyGbrqE9rU8DHAXuRqf9fa5M7axJZo503VLP757F5c1hYfNtnTa4GasU6vTZGSfOK6VUwc+421Hn5rh0peIsWknAFa5gdwLi2SludvMh5FLIeeVSHVrLJQYNWyXPjyHYqjPNmX/uYzwaKQHd3JpoeP3EvWsTE8M7lr4BKmeUXRm5UW2XlRqxfuFz52fnn7q0ft/5Nn/4Y997/e+irtUGgBSt+3D2AO3J8IPY2dBzSuu3/7Gt/6is/e98ivPLp7Vd3yeusNft+XJRwcB723roNJJsA4KToLMTPycEOlp64QpgwmvThQ3uPPJDDt+dOGGT9LmACMWAtpa7FeOX3lWMnZiHgRiaQyQgaERfsVwCRkOp4FBKtNEkTNO9zv+deOoslG52ksjmgRbQ/bEa4jOtyZjsXd1FdxaTxgAsehDwc+y39ZUQDeazkkgPaBadVec4OkXQesMGOBKsFkd8jihTi62B7j4uTrBy5hXpOKVGw33GYf6mDMHO/usB1OEWcMcCYCxRIuSLMSZj+apdy46BOnU9/ECEAFstaK141uQy1v62MnZkJeuxxUKPBbxMm6PTxh90jNGc0SnmUdfz8TmahUuV5TRkuX/nCS96K/Y6BbpnePTZx+fHr/mP/ynb37xjUv0DSLetg9nD9yeCD+cvaVXWrzi+uZ3fMf9hz92/xtP73yqvuBzX18T1Odj1luBOjbXD2kzoX3SqxOeD5Sanj5Aa7Jj+6BKn5NS/BqfXEvgxvbBEl71IfGaEF4fhTI5oIJhp2F2TDYc8yAQHIDTKuicoQM323IQOIwbuYwPs2sEBojeCG7GSjwcmfvWoTKGzIbqsFaOa0UN16m8D6VmOOkZV9upNgYQE45fswcId/R50REo1Bqe4WBx8uSJP3mO12qjOwWSAMb4qg+8ebCGoGlN2j6mxDwfqs+geo6UTjiWURK962NHOz2iFY/+Qta6wtaIHpFp40fffAXnST+l6KnfY4iOBUpz2kkU1tuYAcGLFr2eeaPrqz/xJtV09Con4+A9Ql8V8v1CXyHeubxz+vTpxdEzF5cf+Jjf9Lqvfcsvv/1KBXvvw2u3J8IPY389eMM6nr7/Tz3zxjuXn/6ZF7olql980NUgnw1VTLOVz4hicqvTE10TmZPdXCg5T1RkdJyYAB+oZRPjmKDZrgMEn9xNK8AUrXB9kJeAu8KdByGx9IKYGBm/eayIh6M+qQV1Hb+6DU9CHpJXS2n60KjjE0OECuNJezMGeEiwciLOtq0HQpiJPdwDqWqEl5K9zysvPtvicoVn+yMIzy15OGNs0Zm02DPPdq2I9/wobI5zcrHNH6D1tXI/cTAJeZ9OHI0dv+uFJwC9uTg08xJMzuzJz4tC8BSQ6X1ITJjnwtAxjVzqgNPSL2+zjmwkTNUquYwBu+eVCUuyzAOXvF25efw5VknWHCNBPzX8PmEGlr7ySCEXt3Nk++RIUC0pK66nGbEdl7lOhqfHp/ee09XhJxx94Eee/Ybf/+3f/jG3t0jXvvtQ17cnwg9xT/HF+QcPji9++x9/8y84++DHfIl+Qk0/iPsUl4I+xjhAcq8Gk4VjO5PcJMBq8DlZuhVujgBcFh9IEOREB5cWrh2OlKFRpkM+ikZ8gYd1nnD342uGxOYB2nUpUoXy6ta8TlwG/BzIRvCTN7hwzCOe8arfjKvyopP6ken9ZaGgpRc3tcMZmtTq7Zt88J0fl96xjFmOpSvBYxKQciYTq3gCeygaHhP08HephmeshIJnm+izX6eW5FYrDafHrt4EBxaVsWV8iTV15gYcuUthrT02tFrwsFso4LRowCNtcHH3zfR9PbSiU/nxralYz50S7LHttODNXPsZhMXkpI8WfdW3btmzZmxSN5rkGsSQqWdsrggh+QUnUf9Ct56LTp89u3vn01/zb//BC38Y7oM3vGE3EtDbdt0euN1R1+2VJ2DffPn9d//uV33we08vP+PnH+nXY/iAzPEdvcjWbQrmNhPTt0blMJnz6jGTv+a/jwmfBNn7LBWgy0EmM/Aydjzis5FHzTS0kjLgpS/gulhyN30Rp7bjKVDk6M1csNlIoYV7XTyx5iXJmbtt3MWK0vvL+3IKNqGM5Isz97ujxAq3BCtacpZ3yFPcvF28aCutNF+SJ473tXpfJUugS1e+NWPT0yy6zLlGK9tmilbuK39N3JlxsDOOHsAhtPZDaQGnDto9FjvLBQYvyO5cudaiXCHNcWCjkccWO7lP0kucHOdbIMWqHNgBMmjtDbi43nUKWpcrTGxyWVXDrF28+ooZZxxcgkBQm9w4fu4gpiDjzotmb7fztFLhCxEv9PEY/Ti3Vo+Ozh+95+j87F8dP/fJ/+7zv+n3fd5b8pkGF7pdPXEP3F4RPnHXHAJMJrx/9NXv/d2nl5/y8y+Pn/anRPXKjD8koX+arVr0sebthFUOc9ZXfwgwqQurV3O+XcTkzgLhik2uWl+9YRtZ3JxUnVc4HZwcZNFkqEn2LRuIatFzApxqebM+fnrGDy3U5HtXhFR9xwY/eZPqsRVAnDHPRjzb0RtXQlBN12qTtnGmmmz0yAuntFo79IkXlpTeAeANJnFoBxJnT9v4qaUeM27GGN9yJIa0EaliipGXnNArugaSYIPLMKwEy7KyMXoIwTCfYCu0aFVn0Ai55XH34ysErfAyDoixXWvoTf7kQSHG8ZEcdG1DVLOMVsZG0ZL3OIglB0rGy21W/T/4CFYzD1tC5guIpg0INGpXAMi1gME6oT4cwzEnbC3rbRg+nKBj0b9HenRyV7/seP/izuknHb3vh5/5Or7edXuLVPvxQ2i3J8KfYCflt0S//E9/53/04o/f/8NnF89p4j7N29SakWt286qs3iXsycsHZXJw5SDigMxBmX5f3sdHHQA+METwwcERJ8BxmeMYWa8uEWJI0ESinxzCATiQrI1eCXoiVEJy4TFOp1ZseSuvUg8HJ8ECyU297g9hmNtGXnIrgkYvhBMXjumrmWD4cOgrLtMNPNrel5UDvBln8MqP67oWJuMJTXHzkxTaHIsHokBx6FgCO0VAcPzNeKNVnN5gEmgITbHCE4aSfYhN621DcxKJmbF62wWEl/0cnvW02uzT0uiNEnnyE3buCOSxNVTbhO2ljM3mmnhQC5f94fG4wHb3pCbbkzFbRqvsF+skXhrZAHLyQRdsxuN89dEjBRzfWrLzAtScApPfPYmK8SJ6tnpvsDQpqmciJfHVitM7+tUZ3q6588zZ6cmn/uy3/Lev/EPk5uteU+fW3u6B2xPhdn9c8fJbou/+F/ffeOfOp90/0X14/cQDN0N9/PivzCvLJ0ZNWuat/v7SYeLHJkbwmgbsBQ529aYCcBCxOHiI2xe+ksxeHLB9C6/wUPrKFLz0TRGhSq8MHLUcqLH76N+QTe1Vam1yOlrGqNf7qWqaobhrD7HrSsJxG7k20ZdBGA72vk785pXUXhM9nqjp9y2PEzHr2cAZ9ZbrVMYTnfQB2ocZYoF2ZVMDyEsM+C/Rsp1Q0GFFqm18tclZyFpP3PY1NcGzOAt/ipRtbM+dsRpQavrDNuLPxy+6UPNBmD55wJ115YR/pQcY/HKdzcnH24OHxgimZseJqdkfNnmMO2NvHTAnHD4gk2OSQE6aFi1da5BErhw+SWpvfYpUT09PyXru6PF7n/99X/an3/xzuSrkBT2k23b9HrjdOdfvF6O5Jfq6P/KW33B8/gmfd375lN4X1CsufkVN829dpOkevW6J1lTsgwmfg4GTIgemD56q5RhxLXXBZac5IXiirwOFee9W2HB3hESW/sHjoJE3F4LUKnHi5oCrGQZbbq9JcYsBIaT0iSnkJzASdrFZixhhD4dZiRO+TDcFvY/UJzTKhNV9OAHyahp/v63BZp/HIz0xNw9yma7BahaTbYjexvVxNtbjp7dRPHLwg8mcduCuoTA2LbH0C13rrjFAsIm3vReM9jU420g95+4K2yWn6tgv20nRS776tB4bfIHZl7F7rIqBrZ1ePHw1ayzT61Fu+YzdyYsUvnla0SduDJoMUmZN7I4Xh84NfiW4L6LnIAT5nPxyAg/HNGK1mGpw1crbFuTe4a/Z819ftD/hbxfq59fu3v20p97zQ/e/lry8oMe+bVf3wO2J8Oo+WUh9Z/Drvu+vPv/wnc/94eOTVx/palBTTdNP50HPa738r3v0zmECZ8ktRYiZ2Ex0Toz2Z69sTog+0Ff19b5BcaIpV8m1hGdwYBwowTBl84Ix2vbJDYeDTG4dX0Tc5sHXmAznk7NPgESdkMv3QV58x6ou+RmLa+3zMr6BB0qfkMcyCqObdkWbAPEdx/ypYeD6lesRkoZrlV5vzz6taiFvk7zB6fEHTF98XC9ajdBQ2OIZRxMqKeOe+8e6RYw28SzbB7QV13hw63HMwKwx9mNw6wRPr/Q5FqvXIDLW9I6xIs741CW20ah4OBkfsJMOXW8jOh4Sq3pGbP4YKxJuDspST9gLq8KtV7HsR7CkbTRI2wRqLJDQpKVfnq8SeVHnq0XF9CykFbdIuapUry/aH+vH/y+Pnj4/ufi4X/Jb/ru//itJzQv7krntxh64PRGOnTHN3Ff/v9767O86vfNpn35052l9Z/DuCd+W0MTl3KKJp6tBGdgs+dUYbBp9rvg82ZmvWnxwmFG5lUBnE17s4tGBpe0Pnk5AgBohkjQSYzIOmsNaNX/B6+AUaFrFqZm8bE/RzU+MJN/ecfJiRN+cHW6toR3NfU9uakQPjvO1oz0++akBB4zeWJKkE1MhN4bkB3X43g78Gq/ryN3nVkpoHYfnHPIraZg9ptaroPMqpUqnhHvTRJq8EMzXKtudnnj4GSgx79MkX9N7/IVPu6mI7gbZPGJq+BNre4Wzaxb3On7x6JC0LJoBwOwA7NrAexzkFr6ZT2B1wGaTwosM/swBZ4E/j3WeF/C9f+vxiJ2EjMd64qPjJn64vuoTiJ87GvCcC86iZ/HF53U6ED/Qfff4zt37Oll+7NHjdz/7hj/1o2977vaDM9pZT2i3J8Jrdgz305k0X/HNb/2MR+997vedXdzXTHv65EJzzJPVU02fENUVYSZkToiemWiKY0wJ6a8pNWb/ijKxc4DkgHGEQJpsHzwDIyctcDgOsaoA40lLLR9kBYbvXjnWVu+TG6AWa8cWxAFrLTSEY1POC7kLXvsvcfBaeG9t31yjQI+hbKh7unWEMyTHUj9Ealb+vsu4E0fL9QDIr0Ck8MPdaBVhpCzeINtkNTDbw+86RYvv/SGexzaLMIjS7HEHq+Q9jp/96xh8tWkvZGHNp3696Eh8sy0WGTqMK41cbPrgtR3B88ASz+L08r05yaWPjVm2u2y38MwN62RV8c1Y0CCulWtjlj3rmqNY9p9TAuLQlEBOxjTzE0uPDunmJAdAC/mpYxsexFo4blccgKvCdTLU3zL0VeHRydNnp5ef/LP+0Tc8/t0i3H5whp1wTbs9EV6zUx48eD3T8OjH/vm9rz45+bRnud9+ebQ+IKO3A7kJoSiTznN1PTHw8q8mLhM2CzrhJQ7mAg6yOvDJm80+5dQ6VPoGK5YDg37ycNaBYrYPoKSAXIkp6Pgkwav0rjN92dREC95GMzzwLPBwaNmWHvSCE4sHvfdNCbUGsRCrN9+rBezjRq8Fq45y0e+aSsgHYarEtR1856C90wdnSGnmAWSZ/MENbL7o9hsMUDrq0ja8Dbgc9HoMgqYduvuqZb4A9ou3o/KDb3Ke4DivNKC4ZrgEc1k1MXi1APfjHjHAfVNCh2ucANHJ1T9+9LBp7iu5NcCnU0TGD2wdMLVg0U38MKCqUUnZB81Xgm31UGYcvHmutnxqrCvD9bykX7vSFaR+9Or0qZPzy2eOzt7//O/5vd/85p9y+8GZ2mm77vZEuNsh6z768eVv/WNv/iUXj1712ouLe7rwu6sZtQ4dJhynQk6GXFn56sqzEHz5uQJkwjKJPZHpq9aVPkDF03HgIb2OhrIBDJZukQsyNxRkG4cHoKUPJB79IvsDLTWOHGzN24ggpIYOr0aX1+sqcQW/QkACsgRSJ2OLX8NZqcXb1NsQuoI30941cedPfNiui6/lCk8wGBwvFDCptgNfraDlDN9lFNxsc8gKZp6YV0LYofRGCWisqyzD2gNrXhsjWKZDVd/QGEuzd/lzjM0pY44BnpdOKD+4ekuzEsdc2aHPx0MMt6mfnMRmj4aPzRYTUHZqJuS8jbO48LJsOOKCk+J++ABgNI9Vzka6uIDevkVt/iZXqN8HVB98EVdu56PlZ/LFuqMk/T/mxz5O9HbOyV394szdT3v+3//QU3/Q+Q+8vl2NPXB7Ihw7A5NXTHoT8OSDP3L/jxwdfwIfkNE08y+pee7K0QSvaanOfmlg0zgAsP1dQXzAMZN9gADCc7A4xS2o3ohcsRxUSCVnSAIvIuA+UIJ+Aq/Y/klmHUgHbeshNbRmPjUYB9L0TZt2RIpjMkQWEkfr/IFdZ3rbk7tPmr7s/djRcyoxHK0i5RhOMNkzRjwNfD8Oc8mxcJiL1zoYxOEFrB44400ovOaS2kHLeIxALLP0oB0+tSvObMmbWMYARq0sLjCI1t8UWdzsP+cNvvWGH92NDk6WcMdG1a5bY0qcFOWw0NJ3WhnBsx32yauc9J0HXkt2LH5a6wkIz7ly4neNJNKLZHcUiul9T3zyZYMH8lgqAcwvRvUsbhtfZL5TqFujovLnmo4v7+j3kC8u712ev/iK3/AlX/ed//mDowcXt1+n0M4azb+YMvwbbXI1+IM/+KbLf338Ob/u/P2f8qWXJ68415dTdYfhDnds9DJLu4dJWM8WPTkFZfK6N6doIk0eO5iwJ+6Y0OBuCmwmvkDTtOq+8moYlRhi8QqFY15yDuxlgVNTnZfiTZohrbgmZtw0YzXW1oezwlfW/R5kafS4xGSfRcN26RvbK1GApQZi97qiFScdnTw++MmFcqVGdEsz46FmNAht8iwEeNCW5QYP+KVa0q0fco2D5EBoYF/hTcLI83aSr8VwYiU004Ce1MIjfbPd+E9KKjz89KGT51xWNa7JwXa8wpvYDvNjBD8JirvtsISbB+CNWrUcD0kh815in/lqTfxOwS6HPjZjie1wcajduLAaysLgZKl8a+615CcvA+m3bhSziM6HktK7Ok+dPP7ge17zj//On//z3/M93zO3zMybvLq9IsyjX1+XeOMP/IVnX3zXs191dPIqffLqGb2sunOsP7S7JqW5hw/I+Amp8plVnlk1oXGIT06XKu6VmPjMWOuEHF16YgSLNyhbUzyatUoMqGDnAxN3sQSbsLiOi+LmhDirn3GnXjMuOMQYt/n4hUVtr0OpNHIPAw+6sPCivdcd7K2JqIXXuGYQzc14ipvHilgeh9Tvug0cFA2xSuwQemmrxjfzWiYxFLA7MCRHvTbF9bZVTuMlMbI35uYqN7WqnxqbpNQqMPsPdzPkITBMb5NLaAV/36yhGJz5eDWvkrpucRMnL/s27xduB3aIJ2eOo2taqBjY008ifeEJTy3qepyVHzucrlV6+MTcD7vCtb9WNu/onJxyiXhPnyd96uLo/NX/2eu+5q99Adzbr1Nkj+kW9MG82Va+LvFP/srH/5qTo0/66Ucnz5zrTyz51oL2Uk239b5DJrPnrVZMXE/WEQDzhFYm8GaRs6bpwnvPTy4J+0YeI6lk64dTmg6Ri1FYxtFF9ajzajb5JRelQ596JRc987XyOCo5Wi49BMHBaNgZf7AVqXWBI33lVl40zB6Y+fL9acaSythKstAPoUMMrV1i9rkHVLHNOCd/Z7dLQpKqTx33iZGgpbqXHnTEycWmj04yw4FSot4e2fgsTscOJ7n0hU/IdtVxDjSMNHKmL679HT4pLp58D0gOeeqSe91YiLE99Oah4SQMNexqhocP3C4GdVOb4GjRNr+TBkFm4HC30fJEMo86apyIM7940VFway2S170iP0ty6f0pUh3ffLWLrzyv5y6dB/V1ipPTZ/Snml599Phdz38FQv46RSvebOP2RMjjX1eDv+st3/aTHr77ma+6uHyeP7HEzXYtnrKerdxyyKTzF+PJ1VwrxvrwTH3qLRgUtwIm3nZi9Fo4EFJnJdeagFo+BBDOhl+cxVw65pU2uCnUkRGN8K/04m2uCIqwK1OiClad6IYXP09WwS1HThqBLDHxd7qmgw2h1OgHxKRDbnA/SSl3pC4mGJpq+1jBkVgkrbM9SYjvGs0qQURKqL+CMAvNeKUgYU2M2cKd+cSDh1v19vh+fKH1+ARcV7d5qmsNgCxlpjR916nEzi/juuF3XgVbAz0twHudyXH+5ABU63oSICd5tkOiT22ZXaviqZ8cxwETKB6d9akTe8SqRMeYv8ZYxS5+auFim2ty1SBl5Pi9Qk6GC+dHuXWDVJeGx/p1rIuP/UW/7au/+4vRur0qZC/cXhF6J+Rq8Mf+9gu/+eTok3/ypb57c3R0l+dEzzlmZX4kO5/u9hwUoXFmumddTXq5+fSoiyiWgwIe9HUEOGrbmuV2B7EWP0nL7if8kKqudeHiV09Hiza5+4NqMcY6SYFKyx+oiZBivT2ygXNwQneMvmLqVivt6hZG8hXigR6t3ghCGcdGaOUQy9hCm3y/t1PU7qRDDnKzB7iiVUnGW2AZeWzQSbNdQLSJheuiIatPLr3Hn40AyDIxciupurjdm6Jg0vG7oZXEBmUI7zIj7m0YfqcUf24jsT11+tGiT4uZ2BUcIKQEB7TJK17o+z7peSw8DpHC8/bHgTxtuYn3+LPDSji6uAnN8U25aCROLDnU5fjf6zGXjRXROdhetOLq0Jc7Oinqd9hO7jwt/quOHr7n/le87fJtp7dXhTwytydCTezLYyYDf9X5xffc/zL+usTxiX60dlwN+ssSXBzWZMvJkEm3JlwdHwI8icHnpC38MKshVJNmdOhtq69SPcn7U51JC6H8dIEZK7Z9ra67qiMnJwXqdg65SS4bl20zzKqac4YPHCx9NqZ9OGPpHIxqlqydge3xqe9SO6D3O/mKVSrepoE71kIr7P0jzHDFGC+Ae2iFr4zlNlQFoz1zmoPEcCqldZNr/Q5WNflADceInvpAsyeMb0wOfjCZqyUhfnrh7Fca48a0jwCN+OpatOOVF57pA3Pe8M27ZpVST9KxrlauO/S8n+Vv6thZRVq3jGxn9Lxtpbd/zMIl7Lsz6i1T+pXW++7KvKmaubPjQaKRQamPyXiIO7YBDy+0e9uJk1u8cnWM63N+envnxH+d4vREb/mcH19+7H/yl/7o41+N/O1V4e2JsH9p4d/8g/uvOz355E85Onnq7FK3EDShfCeUFb8gw6TNxK15xhzyZN9MRIMHvI4NcyvkeU8OsbVafCZwJnFOXOYMHmbaHEewzREUgkRiwnONAqI/T4hwgtsuZ2qAW3QSDT5hJV62GR22j1SW6F6RUoCxNqeI7spONe+7dg6aFhc3Oe5TOHz6Kn5lDDM2gtdJQO1hiWB6eoKzQTRh9JjBKt5zSzGg6EPzolX61lMsjVhaSoJNHeJ5bCYf3DkC5zg2Y4SkZmyKxl7hw9D2Ba6Lpx66FZ+dx0Rs8Pz4z5ozUfgmNPJmgZniekoCm3X244juzA2WPjnmaEVPrI+5IvZ+LQ5EuE9qOY7zFQr0UtO2HVZLyH+lQh/+Ozl9WifGVx49etdTv+v2qnDt3Zv9HmFdDf6eb//2j9PV4Jfyp0s0SU7UdP5bP6ztSZTZpT4nxJ607EfhTFhjZfeMXPu515YS2T05Hdk5I5CTAdD+gPfBUBpoetEKLuPpOthxFPNBKN96xSXJnMGLudle8WlMHupsN+LgJxdKBhKMPgth6xxoa18SUOtxiwRvjgXbGDhktdSIH06CzQ/BgWtWim9yJ6VyX1KigownOvQ9YEzdXjC0w11KiZao/jpKb7QTSrts1xp4as/xEHaNGO2sxHbLyGMRrTX4Emny8uH0GCpG17mrhB8w5mPSu49ROdEacM9fkie+sYlVPBrZjgzBPUlZRgCIFo3kGmdneodu65ufHBGh0DZaOAok5h4uGE4FkgN2ZfzwEVYj1j+5VvkZq64G0dTdUb0G1Zfsj47vnZ8efcLP/Ytfff7ryL3pV4U3+kSY9wb/7d97+jefHH/iJ/G7fEfHdzkLMjf089p1WYin5ivCmnXcHmWCemFVLRO1/eD04g1qKKvPbN6iPiDQ9LwuDn7rlEEI0/VlmF8YB0MOiMhH037iJFUbpnP3+dCoN3mV2mANbQsnIcnxh5YhVnCylErH8BXDN1bxghvs7USngs3HKP3rtg/ha3F0WgRHMqWf/b/QtTaWWjMgu/Wjlz7jhS878C79EIAfEnZysHctY/W272JIOF2rTWppJze8mb7hz8A1trlVA83cbQHPZjgNDqBa76vlek3ISxlF7Vg24goOo8BK7ZxwXTeOoysHPIv/ykw44FAqnpS5r7IN6eGYT58lBkE18ptvx/Ba1c5yXLb34wwL86dH9cIejj9NKsBXhXdeeXT2nntf9uf+5Z97+qa/V3hzT4R1NfiV3/1tr3j83md/08Xlc3o5pfcGL/VfU5K5mI8QbualA2vyZr5l4lfIMFhaTPflBAuH+bzHiLUOBFqR4gLFpu8Dpuw1+a/i5LW2NKMBHnu+SjefFS0ETM0gL4WNUFONMW6M9OX29ozE2kTzGX+PE44Wb5NMWra3QguUQOcIsR6EsqNvaJO4ONFc3tW180ukZD2OrhmwUjNe6+5ie3U0WicDFWmYW2cGyp7QXr/9bDfkkWAzvvrNeDp5pOy2h9Sk57HaYKXhNFYhq7eZvngJl7u6Aumyr3yr3cCGea1DWU4YJbOMdjzFOs/wjO22N3NlUA66UantnKnmFw4tMfD9PEkNxgzP3CpIzCYx2cS8T+S7BzPOFSEv7NXpvUKuCi+5Kjz+uJ/z97/1kz5PaTf6qvDGngj7avB7XvFLLy8/7j/wx4qPTvPrMf3JGD8RaJL0Ky1Nqj74PAOZQte3DpeRiblhM3PVork8rQtvP0bw2UejOF03Oeqv6AvjAEkjB3dAzmlfRsdTgL7sa/VL/EnbvcmRTuRSh37mYnvJ5fihfG8fOdmI6ASKbw6gWuw5lr0dDnxiGx9QrXMIsiGjZbsMVew6jDjpe4mdnGU2KxGit+far7hzJB5sjnOft9F/CSfbfZ0m+o5fI978oc12p0U3fnrwK7mln/ncuZMLp3gdByrM+k+yBy/89OQlLX22I761a787L4H0lYBrM7gTdyftwsKd4/BAJOD9oN6/5hQthLkq5IWriMf6DTZ9KFD9Tzp69P5nXofsTb4qvLEnQh70S318+MV3P/1lx/oVmWN9rPhSL5XWrQMmn64KfWv0cBJkTjHxMrfiM4nSHCfgGa0+tvocqC1AEnG1TN7laV14xzDCjT1rCIub9//CZ0yJuZ86aAlMPNLu4RUX3w3uWEzRiSn5TS/DHfyRH3Pfh9MaRQhO70UrOOYVmTFNDN6mKTgfO2Lhgx8GWIEQhgs0m/MCpCBa1dqsQuE3Ll7bMtp+Qn4I5sGvHPyUJzV28wrDzxjg2a+eHPNHL/OAVdD5IUJQm5oLGNqjyJ7XMhgagKnh73WF94tRF4Fw2NYeaMVmLSSj750zN7b4dOaNfqM/eJg5lmed3u8RQgt7+OR6LMIanvagR89zWxzfoYFbiVwFw/HxXrruwCv58AV7IoXzMl8/OaMv2etPy51eXjx+xed96de/9RcTv6m/QXojT4R5Y/g3vOHhLzs/f+XPPz+6qz81qF9pP/Hc5Os6nkj0NeeYI25cjNCCh+M+4KL0hLVbE7O6l4xV+uqSgCe73WG7bALV+0DArjHROaQVdh88hefACc+9uLyC5MAj1/nqownQdbCJVYtefPeIqjVPhiGA2GZcv4KbJ4GuDVZ068bZ4YHNUSx9ktsvLXcDtCkR+jy5JYy2ba2COV8BcwvMGBxjBTBA9lmg7zCt8wAAQABJREFU1hlxx7RyTCv3lTBorjl9ROP3/utBLCPbBLFrKzTt5KIV28JFMh5ddACIbURWbvI7R0awSNBHgt6tDDovHSjdotEl5PJy+kcMZM/5GZ5zynGnxM2YEhsJaMPxUkX9OBbGtnMC7/cSy3Z92b1vZHuc6EUTPRrArhkiJ2NMP3h9EizMX7KXbVwPjn5E+fjO6dPnd+98/NHDdz7zW6DlT9BVyo3pbuSJMLcA3v/vT7/k6Ohj9PNDT+tegW6c62E/3HXTzKqZmYm+Zuh2XhZlezBIh5wZY0b1wYK0Fnw39W0XREd+FvvkVAA8zfbQMi7fB1sRY+OyhB479YvuE6Vz4BfonCSiUbbj01YsjVhqxEgenGjbxq8FufBS0jGtjAcsvrorDT7N1AgXGG3iQNMHwGcpeu+vLktgBJ1PDoLVetsKDD19ePRQrtSrvGhuSgIGoLeA+rT44ZSfMeF2jh354pqmVaDIme7gAfE2O6DVSIjJFQv4TEusVSpI57lSY2g9BZJTcp0awxJFMkc2vVuS5Vg/sHCP/yVFtxJDqucHGBJdr/S7lggdK8MvQiux9+E+D78KVrfmhzTQ9tVhUfyclTohE5PtE7Ds7Nv0QBLRr83c1V+mOD06+8DTv+J3/Im/9rMFXz54cHnjzgs3boNz6f+bv+7Nn3P+8PnPPb889RvHvic6vnbOqzjPKSZvLe3XJFO3DiYoTNDsTfg09c6RmYMu/piQPUn7oEBr5lrMcsuKSOHUmXroOL/60OidKn4GFqn0kwsnWuBzTMSQsQ7JdgAWjx64twmAFh7BuCYuP2vTipuUjgnw9gZQX3JXelOiX725iCYJUmLVp6YpWnk76vEtiqU3GpEpvnMl5H6xrWOtCSrmepVnKjZGDQR7LoR63xLIgAlMu5Louslx7uR1sIxwBs4+R7vryi35Ay4AGni3csibeOskgWAt/vBLCZgnPLdG45PmpljmezSbKwKSbjX2KmEofPppezthZGwynVc8YO+Pws0LR/2miQx3PqeglRa79RNQz5g2tUJWDJw40xJ9jwew/GV4fTCL6KtCeLoqPD595uzevU+++4EfOfVV4dvf/qZSOeS+3K08db/ct7O378GDZb73HSevu3P6iUd3Tu+fX1z6zyz5NMjtA6aYZ4ImmQ+omnx0PmBgiBB79uTh75vn3wCbg45wFpeml0O8c4oAxitB1y4t6rVAMD2q0W8d8ipOl1q2tZq3SsHIo6wbdjnRsCsnvXmb4Bi/goTmEl33WSW//J27UmosHl+NiUC4vV0jVnK9PeGCQ2uqAp2fJPrgIpKbhdDMxSdmPj2tcso0tF/1vnZyRWX7cb6m5iafASSPHl8LXdq0O1Y8OI4nN0npFcy+7jmQeuGURuDUy3bZ14rtmWWyr61byXnrYbMB0U+B8qPPMLCtV5xoE/M2K+465RuvVXByPFZSMEaO9QsPr293olOJlO9bsOBq0e9jt7jRdM6oVZvg3NSKBjswJ3lsH7eV0BxnrtU8rimLHn+RYn3SWxeE/NqM/zzFvaOzF+9/0e/+y2/9VN8x4wMSN6jdrBOhH9wHF1/2zf/rT3n0wfv/1cURn5q6py/V6PulukvA4+6vTjApcYQwcejta4XLhJuv7opK15N+2p7MyvFEtZCph1XpBoDiuupNzzjKdzwx9bRMW+c5aY2V8dKozYKfbQJPfBVaMeLhhdu6DlQ8+VXPGtjFiSZ10ggzVuthJzeEXY/UbB5b5XfqIMW8Tv86rLVJbMFlhh+Oxx4Hevgj15hwPx6Jj5zDDl+gKRk0UGwCI3/jxqEXv8chP6EMCT9txpynAJhLypjcmdNjGmDXnJhsa+yEepMKn35TZbQ9NDGv4IlXz1iaU0b74aZo/PQQK4aO3x8JBB4h2aZObmkUZILpDSxC5tHmBFm6GTsc0uZ+NYWVlkim91gV6pOi7NaQTQK+9cv2HSswBdWtk6G5p3yC9Oz09JM+9j3/5OSLgPKpeuyb0G7UiTAP7r/7Z099sb5A/8LxydP6IxL6yQW1mpeymDWr8yTSS9RMTji8YnVC+kqkMy/BijeOj7SWSumJG8GkpldKQp0TLBr2RwJjoAbNtZfpdeMVsC+u6ay0eJuJ46NF5uSXP7eD8BxgnkyA3SwSpzQP7sGy0MHF2kN5LHpskyRyx3c15xizH0iFliXbHLz3BYAE9tvVJfaDhN6XNiRXg1fcKykjtudc4aYwvYJxsyEFp+qVvvXKoMt+s10Ze14LqcDch40Pw3rRb6FDHaip2WmzuEDPMWG9fU/KgVuxLiXjij4cLZCnJmBzK2CeVySoDRuutx+uln5RbKKuuBbcmn3lWNrml+0U6Vm+MPSvjAeC4q5NElxhjCOPRcZhbIVhbq4aq4Ry6htiXB3yi5L82szRs0fnH3jm13/d9/3V5/M5CgvcgNXNORHWF+i/7vv+7PMvvv/pX3OpB12fFNVs4EaBphUzREsm4bUTkQnBhKxmMzOrJuU+njAp8Fn2WHKsVxx1bsE82UciJkvHF90HhQ8WBcOhp+253kaBE/dBlAT15kRoyZhPjmGt5u0X8jdXQ5BSoHLibmpN7SJ07YqlA48GmPeNejDKueVEVMAchnOngBLahagl/tQOZn05+N4GA4eVeaNgjxes2ggfBj7ATa0kpXdhpanH9IJdDt2VVrFDwmKMIRmID33a0XNNBdMHd1816F6qFa3nKtxg0/b2ECvBTT+KdG4GjEg1j1O2c4eOcflDxhmpgZPYxEwiRm4twdwL44SU6QeHOaKut8MnSgCwWjBSx3NKOWyOMQw76tNIFOZ8Vmrr06Ay0ALQanNsgikHrH4yBNtTXD81o+fB04s7R6/6mT/0ttNfADWfp8B+ubcbcyJ88IY3MJWOfuDNH//ZRxev+un6YW2dGn0i1EsibhZocvie3XrIPcmN1aQCtsLBZ7JlorYNTy35yzusS8ITFQ6+Z2JRchAko31xXYuAk1ae9SiehmaKVE+4UpZRXPPCTf6+VzyUjY54Keu+C4wAWgr2ePDVomenRDIWywzCMFeugHANaNX7BSAJ1ce9JtTc5DeXMZPwEq2GvXmcpw75TCfz7BzGmdwp79wKbOIbB9GlOa84e/9ew3WNPZ7CjI8YC2NUm1Ri01+M7dqckNAoHViGK0YXmg055A46KdcAC97UWVBkDvOLs0/pFmXjb+oX4Up98Ca2yoLQPkC28K1RMfw9J4/PrGWOVsHgxGZbaXTB4js0wGEeHsuQSwOX5twSzRWh60qED82cnD51cXL6sUfnD1/5K1fG61d3A9Y35kR4dLQe1IuHz/3ik9OP4wv053qn2DONycD88Jfo1WP3DBwzzRO0uFC6KSGT3bkVGKmOT59XZcnpWi24jOYjCn91K1iFrDFjkBjPYnltu4DgXRuuQG9baZIUHjYwPospMjY+GhVfBDmj5cAG2texNsk0iy+TdY/rAJljWtWcIexZy34RprTtqomdfYFNvuPJm05hGwI5lZcwPVjvEwA52Uz63g+lnxjUtN4WF1g5RW+x1iLJztAGU8LMmfYhMHgQslR+yeI9sfVYd4yuV5revw3uyLij9jAPj9HITTz70r5W6W1o8H58AZFX73m13M3jnW3o/OL0AzdyMNHJvil5MyYOkK8w1Hl6DUuJM6dtBMlpQI7sjI1YXgRNrDmVD4/BedvtrLHGN42VFv2NAX/Bft0evXd08ejef/FAf6T8wYPjCxU2tSRett2NORHyoL758hufevH9dz7/4lIfkjm+xw/u6YHVA12zYn1idD3WTLLMRXoWaJ58xBKsmDrHe6Ltps/kw900aSWvi4rQJUornEh3HLEdhxgLOeYNcnScFjEcteliZyE2JHC7Tb3mTCEx45orJ/sx48NvnRJxl8RUw5/x4IXFpU8N7Mg0Bl/LkIN24NmrVeqlRsQqvHM7s0q0vzF2SZF2X44p4aXfiPSuaHSjIzQ+BG87hrSwic341oH4YbYrgof9uVEa2+KnWcZSuRlX+KH22BNQv97TWMBmOwYH07klRBctesNPShZOKPy9FniWve7MIY8Gx/VwqiZdcGvVPdXc0izaOjbkmKtV8K4jrI8fSKUbnl946+kOP8fgfL5bL8z5vMTp5Z3jF17zo//Hx3w2Gg/ecBgy/su13YgTYe51/y9f8yk/9ez8qc+44PuivENMY1J5duj2aCaQ+th+A7pmUyZV8txrBe6l8sE9qTHUiEXPgHibV3xwRMoENYecGAioVbd6BXOwmDeC1pHPBgJHB9y04vZBBBdS4pUHLYtM6xRt7TNACOTRL3MZ8rPN5FR4icArIedVkM5+9AyUXATUk+qV7NRdYOmis9I2a7ipS6A5ZbRWsuDDqz5wEknLsq/vMVYuJDTCpbdTJHzX2eGAGdOVMcClWWyZ2Nfu8z0tb2Ad0no4U67Ca+wKeBtGn/jsnc+qlrndzSsN+9gyMu7sx66VJJHYR+ZVPnlOnj0cfDXHl7n2I3nl06E1fTDqBnRMq4kRQz/bRU7rjFxwuEA0a6QfeDiJm1yrK1ht2MR7v20S5YhLrFLWeFU3fujJv9SVn9ude+d37vyko4sPPPWfwrkp3ym8ESfCt7/9Z/rx/8D7Xvisy8tXPs1faPbVYL2kZLJyByAnJ/tgWkg8TBY5aUWak9KTGlwtOXvbQeJayN3kJ5g+szY9ebGrjqnC7BJLPBrpg1OzsEBXckIYckBdu2zTJMKtmo6VKB3b1rh8t6GdOFzzBh/feKW1ToE8dBAaL573J5zSSnyznxWr9Moq/uoOWCzpmY+uGjbNbpzqU8d8SIlPW5jhitVwt1xSK17dQUqAY4nTg40aFQLZtgSqr00yJyEc7LlMXuZLxufk4mPPPMemsIG1Cg8PLdMGN/vXMTnmsyrbeaxoExsaS3RRkm89ORvacIZpXeZQxoedW50ytw1gD1adaHRCFXGnVb/grvw8FzFIOJsxi+NSWoE7pTRMNnAYMzXRiNZ+jD5GyPEXDPmFrbtHZx88+Xmk3JRPj96IEyEPKO3hex//nJM7z+pm6KnnhSaA/ubgimWNa0xGzaeaRfIzweCQIB/M8E6nwnRum3A5zi1NujLNj27wTWxJroNAgf02LIE1xox5DbgS1VlPq4wh4wP3l20P1B4Xdcxz8tIwv/yR0mZympJC1CkQaG5Dc2UM+hVNA0VwfhKFWVt9dLOdEcEnNfHGY1Rf8vbCt9bkKZDSDQtD2+MICAkRtfBxPYbCHWS19zsgQ8nO12pP2/tJ6+0k0ckr0vwY6ns8wSKSfuBwo50+NHpTR73GYpRWKHZZFQ7NbfjUMb961614aBnL9FMDveSHB3bFJjkCSiAeF/61beYUgVqtjcZeRISenyPuueOBrvFGp6DW4QK/5yRa1wws+n0XKSQFuEV6oo9LKCZTZ0Pfr773U772u7/7FZa6Ae8T3ogT4Zve9FrfDHr0wbs/7fxcf6JZDzQ3Qg9z1n+nqx7zmkWaKJn44aXPPMuEDm/iiS3R3eSsSYgeza5WeRVoX8FopGcyx86EztVYYs4tTWz49MRp7mVT23HtGXPkhJMalXLgWkGrJJdGYONgpQ8eTYqldvPLaI58aiP/pLYf29qIpZ3xJnfqxE5PkebXeImxBJ82mp4wGAo0V+S5vYRp0Vje8KsWOBrdZkLpd2wQvX/Kx07aoHRaCkyexy5y8zHi0CMYUZQqFgpQ2sTyuLivQMvgawmn8SHklMrLGOKmN304mHHTR5J+YvMxCt69jGn3fMxAE9yLVjG2K9sdKn3biRcWHIJLpC89upTm6jP7jT7bgQZLNyVk3ODJd4041bcbXxO7TN0fxTw+Ont09Cn/+h9+8FPQzyfuu9bL0LgRJ0I9sJfff/nNd/WpqE88v1h/nFKTSrfF6xHNLJCbCeZYT5QKbOn2NhLF91SKXTnodT1hhENxTa0ykTsoAjFwx+DIN189zZ/3oWdhtWuGtNrXhtbacQCqDbPHiVZOwE6WP3khUitjto2msDmGJII1R7Rsp+PokDtatlGhQ4P0BP0DqepXIp3rVoFZx+MMz8SlUlCG7rFl/Js6aA/Bliijhusxd55izQPEmY34wGKmb+oV4LAPPVYRqe/hhSsnZg/ChFIlqKW6Ag+6Dcjw41O5rTkIT9pf1k9eClFziGT8yAGbHm6Bc9gZcNcUN/EhaxrpaV1TpOa1sVjRNFex6JIANbjZChKfy1IZ+uQErL5vwSrRMQQsPnq4wsLFDa2PlRLOdpXbx2hGz69r8Xyi0+LFyfH9u8enz/lEmE/co/1ybTfkRHh09J3feXT3/Pz4lfVe4DFXX74vr0fWE4PZs281Y3KllnD4TDRPrn1u5YVPDzeLC+5z4NQCn9YUjGjKDk4fmzFiN60CORgU6jbzDApIHv4+bp/Vrk0oBxmU3i/YlZMTQ/yCD/skAL1IjCeLQ3JSY7NNhcOlRT/+QoUHCKECgZO7Cy/BAhMjJ2Mhb2oYN4FINfnX8b0dIzn6ZPU2Eh/1J6fUD1200otMXdxAkGM3XkBwCz4JE77hmbxWPbbk0he/zM4tyshe3BAybgjoTn72cTRDiL/hkltA40XMeOljy3SxrinuHIs1ihy9kvMYjVUgcQeUs+HJsW71fo4JwYNYY9ofS1DcpOdY/NGHM+Xg8iIWTF1vcDTSW0ZnRH2nUCdX/X0mtbf/zJf/j3DfgBPhegr+F//w4rnHL569wHcFefWkxe8PcmsRP5Pdk8SzQasxcTK5EmJGeVJVAjYatOqWM+IL6DkY10BPRPjRUY8byJyKYdNwMXOlVvBmbPDC7zqA1Rh38oLRB6NGb1vVJ56TLzZc8yseu+ltwN61a2KpnR5xbwPcyW/C0pyhTZXwQqAHo9dS3UoRjt8tzk7D+01Y4OaXkbQ9Hr/36eQribzk2i4MWvCQ0PAyYuYUTs4hyd52BW8g2HPBmfHss+aMoDGt0nu/ZOcIxIxrXYhqjF+H4GoQwJu44oGLtR1T6azCKz/7BX7mPravnCRGyuRgR3SYpByaAh4WBLUMcR5TwdDCtu7ok2cJE5YQpsdZAh4b5DQlVNmFxHkJHGLJReWKb06R6PxWi7rjoztHZw/PXnDimzr9ZWvcgBPheuyOj171ysePzl7gfqj++6HnoNCPjW4OCuZXLzL2E2kzEyCqwcmCn5OSwcEh5gOjRJMzezj9hK+AD7LSIBcffnQIVZjUbuGY1+jWcB1BcDetgOiGt+HI8dgCKsf8fV/xaESToh6bgMbQHHptT1y2+awqEe3J9X6KTvX7/bDPIZ8lvNbL4K6pN/mUcd1OBOkhbsa3Ioe1deLGUb39dmRsplYdOu/bGuccbiT3xdEJbxMTWLJdYr+fegwIlIj1WrCrLkN4cq6jEPM2VJq1hkRyrIFWxciJ7qBvTO+XHS/YhlhO7lp0LPXGTuHFX8bgseJryR2HxNCYtv3iNo4hbW+LTF8VQrymdY5isdOTz5KTvNMBRmOMU3+G6zlx7U9ujXqDxDg7u4vEZ37mqyd9qL58zBtzIjw70zcmfA7UFaEeaE6AntTqfVUYvx5b5oL+95KHHHzfroFMMbemUDi4Gw0BrhVC4sKvcPeF5cNhcSsjT4x+ErNICLvaoyaMdsuIn/Fat4sdtDpeIn5SUHKo6ITjvoQztPSkuzkhzq6PKHASSy/MK092uzg8lyjcNlj86q036jUsA7t9E9dqajh1kJIz8Q5XkPzGkBS5hxBjEGxqldAYyvUmXMgkOnnQhGf8oDMcO3Xij+wrJhyW5KTf5+5985K8D5Y/4Um1vQui5/0qfIYy4MaIj6UHDqHw5KTPXIMCJ9uI0XbI6sN3PwmVu6mPpIWXVuyWS73BIVauc1MPHJtYL0XUT24TFl9fIdMTI/9IvrzUBypuSLsxJ8LT++965517d969Xv3oVKizIBOLk2GfELHrVunm8RdOczcmU2Y6s4XYXOB7ElYuPi1uT0oB2PnQiwnycz+fHPTh8KO6aX3VCWCC+hL3AQOWJttjia8+4xhQNqfldhKHDVSSY0Xw+GVbEyxLeLNPjrAuiP2ElnGmh2YJrdKDzfjWWQlVFqrD8cmLnVj3BEu49fcJkNU6vtzD/pZ4Yqkzn9DAEic1j1NjMtoubXeFOz/CM7634SM0uNZlNRfyyoc/xwpMA9uPO7j5lQ8WHpCPs4ERz3j2dVILyrTDD0hecr1pkGXQOTbyHS8cQvI29krXWs0iq1tAbQ+5AYpmt+omFE7GGJ9415bNfqHRZck8cKBw7GxjtHwVW3Wdo0C2k951CiDO84bdEvDYVBVs4QroyuDi8oy/SfCImm9/+79LOdyXZRtPrS/L7dNGrZsWH/dZH3x45+7R+y51ptNZkMmnc6E+QcqJT7MhJ0BPDD3s8+TILPBMGNPBk6Z2GXAmUvpB9ZPb5O8nuWWU4BwRzY1ABCEJc8yrsp28VgUP5KoZuWu5BVI6Y2kFxcCSZ9ukxfAB1+SDkZxBtYh9rbwvEAXQYrzSsV1vgNfVSdgycvCDldRm4OERsz5GJbQP9oQ2x9D8UdD1tWpoZ18rixBLJy1WuxjlDLNJzVvI4oZYQcsXRjfnYaikF30pKcl+EbztwRZjs6aGWxkbLQICometQZj7taiWyqrzlkwPNNtBfjibnDj0o57d4Ts/GqESL47NssntlrgJ2zFs6HJ4vmm9TXA9/N5t8GZs2l20OHDBqsdGY+bHzvYVnU7cdUHQMQ3w8vL8+OL80dGde6c/btJrvX5Zr27AiXA9fl/0S154pB+XfffR5blmyboi5OTnSaI7AP2qLBOKPgsShdPnYHduTQ/BhLqFM4EcsGDJ9ZVdac+rPLTy6m0zDglnonc9jNJAmzrRx3esyME9lhoktv0WrG2UbxwJ7CVlzKmV3xsujvXRYVFLfqjGR7x9CE1yatezlFYZu6Plb7Cqt5PxWJp3JbjTvTqMNZisld8SGZMHGMLVePZBj0FUUrI4s7TA0O8aDo4VhNF2rjXXqkgSgpMF3c6RMXEy8DNejyEEgmnB1M9tItyhNpI0tonYE5r1RjzmBi8wsS46d1oFe3vlo9E51J/8Gk+2PduV9w07LzkFNC9+6dgdGKa1lV/wMFaSx6dgxtDE1BSN56xrx80zeQn3c1lRSY82PRp77FwYeRcKXl6cH58//sDRxfH5jyj16DN/8AdLGe/l2W7IifDy+LOPX/f44uzhD+vjMTzQukN64U+N+sHX7OCWaU6MftWmxzuThwnmmUBfC9PB89OBZWe+FrSdMZUXjvPlwGXigztvJFOL5nhxeiwEFCeP5h5OAekTBPZS8Wg7rhX+jINb4xp8DTqZEMtWHxPDw9fKfWgQ5lKpTcJvkQM1NProYQ/qlXpNnKS9ABoZD7FrWrbDelW8Jds4JHrfFr4Jl/Ok8YdLvDltLAw3vEPFYYUgUlI3c2FHjdtcAYw/fuIv1b8U1zFWWqrbaDu+EzcW8nUxYeyD7IfWqJzM7fSpPRMcq8RNqRZTgevsQZ7h3TBdyvHiM9ZNTeFPzE+Ax7Dyu6dQYTFbG2A28YaUnfjRy3Oev/iqJ0FdDep9wrOT84v3Pz47e5eeL29GuxEnwte+9k3ezjv3Hv3fx8ePdcI70wQ741H3rQpOhv61Gfdr8mSCMGEyaWxrXjCZjJWd2QbezbOzPRtPesK1XlH3T1qpQ3ijL3/qEbum5Dz2kTg8e2AnCVvN2ycsOq4tx3W9WrwQ4O1baMT28Y1OiAiEGIxeGJ2hxOFe15q4+NmHztVq7kOnl57jAsIjhn2FT2CMoTmMUY7z4aTBHaD1nBTCIT5rjZRFvAK8JOyxuLTyouvxDZ1hHgYDWIEZD5yeBMfZ7kO2nY1fsSsYwABtatVjHZpNbWMrOuHsbrDZzBlg6vixrG1wWKvebxJoHmKKDYmWT14DUEMkBzu+zHmVFh414czaBTmf56D4y7pmnTrq0WWxblGNcbWnJXUPGMlq5Cl+ri9ar+fFs6OTu0f/+lM/94V/RfjB619fRLyXZ7sRJ8I8dM+96vT/vDx/nx70x8eXnAx1hzQnwAvNVF8djkmzTpBrEnvyMGFq0sTPpJszJViekFPfvYjgcObSB8QghzcgJ5HX9RhPCBhjYYxXWmGtHR8iwmpAZdq/djuKZ8I1da6tbXKt5kak4CwqzC6x6E+7ZByCWLl0qf2kcUePd4/DLbklY5FDWcfgoq3FpbTC3jdjFXhSPPktIOJ1XLSNv0QcAtuQ7TB/P6i9P/gd8qBScPQhkCPbtFGkTQwtGYvH08ElUpQlBLSLO39Rr6yzfVcDqyb4ZhOkjR8stTyG1LWzhnFFX7HQXBO/llnLY55EOE5YxbFZehxlxyeWk2QwQW4+RgXuxxa/e7EzNjR80uPEp8XjW53H0VgNEh/+uQbBSVAXCfp5GX2G4vwDP/Tgc77gPUrV4NfnLGy/TFc34kT4mZ+57nHfPX3vPz66fNfZxcWLd/Sge6ZkAq1Zsn/j+DDBzGMSZAKVmUk8cWPikdMnHPjkZmLTR042PMcLzJN43qNQuA8m9PN+IrzYoiwdG8uODhDSblWr/cDC4SdHpseUcUMDi5DtBjEqTqCDhpPyRLy3fdG99viiE031hoKLeV0uYfC5jfYnFo0iJU4SUMIezFgVvb875lDA9IM/TY9rArJTy/VwtMyxbyQr7qRN4BrRHdQ5KpRas47j5Ox1dz5utsM6Xl1Nyw6Ev5O46ouATEnJOtiMcQb2j5PJ4mRbmL+k9ELMpALpBjZr7mgrD65I4XX9g5z1kpseHgIzj5hhNEOs3vyBhQc0a8ZvKlol1s9HFXRenRApiA+HF/58O4KT4AXfkpChW6JaHuudow8e3bt/+Y+QeO1rv00/x/3ybzfiRJhL+1/9x174J6d3H/3TY39g5rGuBx9zVbgmRE2STDheKcVmAjF54tN7UtUEw0+cSc9iTvXQ03xQlBYa8Yn3ScjgyujXYmCFJ4xuxgI7dXIiM5YacpIHHo57EiuYcdsXNnM6hoDaSFsA6yRkMAUZBgteyaFnPFO0c9Ddt+gIdy7kwmLSt+4+/wn+5CM39+8+ZQxhbfcGWGzyp6ZRC+/Vevgd8PjxrtENnBDcTZtASCLYHH7nPAkT3iHsdlam3R0Wzd53uzhudOjbLnzjt9gaR6T6MSenFs89Ob3pIQ8NmxMXebqhdp+g+owrsb0PPuihHcbXiAzqDs3kQQnex36w9JUHzyeySvZ4eN6q5y6ek+Zi3HFe8B/7KpDfXj7XdwfPOAlePD46f/ziydn5jx+dPPXo+xhLLiKwX87tRpwI9UykKfHg5AuPv/AD9+4//t6To4d65fNIn5fRiVAnxUw8v0KSY1+PevCc5BpXDIxGB04L37aRtUqcgxcqvf6PI3bLw0tODu7FqLWTR3r5G44c4BraqhdCgZ0mY47dNDgebCXJXj/Iu+CSaEprQZ95le4upMRLJFpNFdDbH1AY6ZbYJ+AX1qYM2wPv/V6ahHpI4VVflHUSCwmQuJYr46sQlLSkTW7kr/QBKokOyLCc1qh46Km18eOkhyQ7bvrkVrjrJZ4+8eYr4NggDLNp1+UlWJuxXLYvAfWODaBNGcljf3ghrwjZR+mH5DKTPAOlmRz36JU+BUveWdP2yXhqxa78ThxJMamT4XRN5XNiS/NJrE5qxio5Yw3m25sVy4kvmt2Xjj8XwUlQJz9qrZOjPiBz8fjy/OyRbo0+Orm4fO87Pv4zjv8++rmIcK2X8epmnAh5QB+sR/HuvYd//ejiXfoWxYsnlxePNBEery/X+ysU6+qQq0S/0srkyWTUZMurLSa5T4ZgTEItTGzs+H0gDDxxH0ThrqH12k/YOUpALayu+kChUH6fkxhcmnMBK+BxyO2xHkLelvC8XRGrbRTV4YbZDkBWNkYPPlsnLTB5gT3Oyd/ZswQh52kVvLdHWDTDyza3pJLIgxdudMKxnpzw9vHkhQ/Rdaqf8WvHhiAN4hAP7FiFWzvgrnd6JWZb0++os9Q2lPyBMjQP75pYxgS9wiPzYM5xZFMTxZ/J6Fgrhnr74Ni1kOaABezZnbV8jCo0KCbCgeyO1XIPfSWYN2IzJ+NoTmlapFaJIWd7x2ms4hlP8iwjMM873U9s2PDXyW2dVC/0bbGcXPM5iHN/gwwiJ8QLXQ1yO/TR8dn5i3qme3R0cu/R277mi3+5vjohwg14f5B9doNOhK9njh193M969PdOTt75I0cXD08uL9dV4ZHfL1SQCaUZyG2DdbStScSkZPErKOx5YqxYOEuj0kfsugNR4XWAYsyGn2WPl5+wU73aahW0dKbGsPcnTwbjAxZOC2xt4GyLKcUzxipBmTTCXtow7BVQ8th/tPSMLfaK1Lp45iZQWJfHEBZqdFwrMgrmpAsv3NYIWFop5X0WZ+SlBhsUXW8D3Ck+fezohzPohGcblAMcUH1upQU6kA5DmNgVm8SMp4JAbJu3j1jaE4r0fghPfahJD8faxEMYOZgNJ3HGB+b8Ig/Y7PiupRVcU9OXZrBZom0F0ck4W5MkJzbTxh6elNR3X8TY1hfWPs8zWnIiaxyOcFo/J1UeJ77gHUPDV4D8hBrvC+onJvXC/+xML/jP+RT9I50QdTV49uLx+dm7defn/W9BI5+2t+DLfHVjToTraeLBybe87tf+8DPPPfqOO0cf1OzQK6DLR/oEKVeFfJFUU9wTap0M+cUZT05Ngpz8PBnxM/GYrGXPGPMm+MYWlxpMUp64cGkcXD7ACgveBMXRm09U8HkA88SbeHTgJoaOcfFp2BlfZF2rSF0/ZPiVB+S4Vuj7CR97xOHQrsNWZMVsD+EekwssAczge8HQ0LG9H7/AgqAcmkDvLyHpD8FhKT813A/fgQRHCmb2icOphTPGd11qsB5zAVdwigRUb1NJ/XgT/1BaNOBSND59bPAaUKAr+yyBqaG0fes88UuyKY5Fp9FrjNQYXJvDZ+ypRR8bNWgsqb+3zSlSl5KffTv1oKUZl5N4fIrlpJRx5fmEK1Y0iIdDXvMqbi2ea8bzjfmjnq/0xI+OQh4Lz2Oc+MC5JcrzHHe9znUS1KIToE6GvFV0/uKd84sfe8erf+7p3yT3Td+2/qA59su93aAT4eH26Cs+/fzPXl684/zi8ftPLy9e1ElQt0j9wRl9csqTZE0gz9AxsTwZmZhMWnAttOCe1MTHspnQNYk5AjmonB+N6FiQ1ROa+BycfqJV7/TCSsr1fdAW0Fx8uBIIlyroLVGMFQ8WHhfJV9oOy3YvwSvsQ42RR45b9YzNYxdoKLh8p+FrcV7ZqTe1mos4TukkF8ic0cvcthBmvS1jeYo3tepkLME7DS05xjHKJ46b1tsnIFrEJsciCGmhgze58DdtJmNPf0Msx6JlX8O/tpZ4P5GsFaXt/B3Z7h7Dn1jsOb4xzDLdPWmMK6h1acNDbtZxKDghAJqJRRUGnpOPT1Q6ztExfcRJBYNPT455PC8EDyagn0+EYV/xySNWi8cBb2D96VBfEfKWz3p/8Lw+HMNPqZ2dvajloc6X79enRV/8K3/i1/7X+iL9A/0Wd+4xaHAv83bDToQPNEWOjv/iH/qiv/v0/Q+89eTyoWbNw3OdDHVVyG1SfaVCs83fLVTPpPFE0uTy5K1Jhp0J3AfAwMLd957tSnWORpLj2DxGRkOHpj75ddwtfIU2MVI4SJrXxkpBJ20XWjkFNo/aJCRPPRQvWsGLHd0n9hDVfHIbejFX0GuvepuVRyo8XznLSY57gixqV8YDN2QTVq53sWJ+IaB4U0rHYlmBFccn5+Dqmy4DDS8tJn/YpO39kibktvEjWNoQiLO4Rbt6tL0kPvtopSdW/KZRJxg8taaXb2CFVjD2GGOg9NGkT4tt6Bq8eTKSz7xOS/6TfOPiOzek3nELD0yPdLg8xtRKXfPwwyk7x655mlDhp28NYrXkOSK58ZOz1yLeOhmTMAYT/DoN5/GeIDytuEIEWx+M4QTI81l/TeLo/Ozx5dmZbouePTw6e/S+00eP3/HwVT/1+FvY9nymAvsmtBt1IuQBffDggQ+NV33SxZ88Of7RI10VnugWqc56L2pS62So9wvXBF63D9ZJkUnNLQUJMDGZqFo2E7kmbCbqjDmHuNKTx1jgTD82/Wypa4Gqg82GoOENUk8LtrzxBBqgenjm4pOLTgF+4sceLa7rtdOpzUQqYYM1rj1hcrBNq2SPoxLM02rPJ9zYE2qYIFLC4bMNL9UcL05yUgy409sY438p4cqd+tCR6ToAanOMm5or7Bw4m7wxHgjtioSdZebMOiXtbnImbhuhEKpIdaOoKOGI3nVqEM1HUDzDG3CVsITwhHJ8kUYznmB8R6rmyDUMt/htwmEZeX4OAONYV++6dVzmOHUOnLEgEq3k4hsvrdjJ6xzFg/FeX49B+dTMtpuDDz859nkRv56njCsBHU6AnAz5YAzfFTzTVaDeE1S+el0EnJ8/FOPh0d1nX/xLf+q3/zdv52pQz5NSvDntJp4I/QD/5a/94rc89ex736r3CvXp0Q/qqvAhV4WaWXySlJ9gY1LqZMjE8qJXU+53E7ImvicqyuXPg2BpobcmFn0OLpD4K3rgoBG9eRDAiGbs9OTw5NG1HADAWJ11l9vPZytpgc4tvrXIK7/SuvMTVXtVO/7ISf7UHmFncPs1Yw8/Uu5nMSUnfz7hBjQVgpaOV8JGRlhqFX1T0tg+UD5dGjXio58a0Q5v3ycn+LX+DpyamxBFBSTeYxKW8biOHPI2ueVPLJxg8a0RB62y6ect9IwjfWonn7TYHsxmkIdQBg8/lCua1I4gpNjIVIy4jyOgwswDH8da8+Ds88VLbvfB1PdxCjbqTK5PYGizVI7HKH6eRzpGHC1xHfOJ7cAD48rPvwzjO1jrCpAf0V7fEVx3tS50RuQ9QV8Bqn+sr0o8fvyQq8HLs0fvPz07f8fDV//UO/89m3vTrgbZ5ht3IlwPtO5/q33iT7t8/fHRv3l8+fh9eq/woa8K/abxpa4OfTLk1RVXhkxYZuKaVJ60NYkzYd1DAc8yJnDzrLUOgMamVnJnr7G2pnDfKlTf4yhuDia4m9hyrQFOm3ptr9CKlw3dTz7UmHH8WjYBOEWk81hGXv/dxfAkDocHJE9yg25zrxPN9JYyaZUu8yAjINoz50BYVrZzj08/OhPb26m/r2Wf4GjosczYhoJjAiQtL9EcngMsPt1M3Y8LyZmGP/kzlqHAcZtEAfv4LrwVLonuINfCGDt3YM2FWhz32LXkxEGaD9s6DhNfx/PiO15ayaOnuPmyjQ8NYmBZwnPO4CV+VJh1Mkau+NDZa4386PqFK3kzZpu3b8DXlR+3Q13TV4C6CtSnQtdVIB+G8QdjfDLkavBc7wvqJHh89viD+oHR9x099cKjb/rTv/NX/bObeDWoR/vK/Ae7IY2T4YOLL/yt3/rH3/vOT/2dF8evPDu689zp0Z37lyd3ntb3Z+7p2fmuriZO9XFiucxyZWBxJlqYTFzj/197XwJ12VWV+eZ/qDEVQkg0BEECEkDFaKOIbWjBJU20ha4SRWwRMAsVUMSp6e4USjvbdi8amVqjgmKnBHTJcjm0S2wFVyPIAgmiMoaQxMypqn98U3/ft/c+59z7XqUqYUqsc6rePXv49j7n7nvv2e+ce+/7neZIgE/87Jlqyigm1mu5CTp0gSt4XgyyCx3qkAGmdgBJhe0FH+1RSRldsBbGQcSUJVip3SDsoi7xDToaodD9l2TD3rHcl7Kcjg9siSvppAexIEdb3qx1r9UH4hmPtl3wyZYE/VuVtxAkWUk7Qn48CMSleICJdkNOE9LhcEFOHQsUwoGkP26iv2RPWUqHASplQYdzYuBbfYZM/TVRWDdrAU0U5xhFLOHaONsGRroCEG5k6w7CT2lPOnyEnm74BQu5wmLjmNCDTYW2y+QCuI56dc35optqO/S0ib6I5gZFMhgJ52DKSj+GzNuwCZCZcZXKKG6j6Es7nQGMBx6QZJUlkRz5qzHMvBMlQj4PMZvyVYmN6Wxyot8bfvKjX/2c/Zf9xBOfhhes4fgsekgmYsfz5CwtV+mUedgT135+MPjUjfPJiUFnvjXrTLlEinuGWCLt8GlS/voMvmmle4Uxyvg3MrLxTS2+AZIPWn/ni1cicf6Jb4HBs9Y3u7vBhL/UVvgqfLMN+tbFQT374bJoP9V+1Nk2ZSzRH9qIp2+UxLvcpM2tbCEKf8ugkmHTwIYbl5Nl/3WZt5yQjT4Sl0oxGghDBYjwk3yBSAMUgYVd+FL/nYl+kl0GlzkVLKiDdHaZ+wZIeDeKdpd0Se7DZ9lGKGgTduEndMtqYcKAADpd5rgtAx+2qtv6srFCRyw/7XMx5NLhXBPPmt0pbChIuqBRp2sisLTFJ64l2uncRZ18uCz8l3X0L+qk875R3uiHyymzpUhrX9eo90N9cNqWMD0OlLEvrJGjos/JP+SNmR4UegAGRvaahM3+eP9vohmgLY9OtQSKhKfkh/uBeBiGs0GOY0bv4hdk8HDMZGs+HW+gkTs6e8+bv4xJUL8rehYmQZ625eVA/qwqPPDHjh2ZfvuPvfE7b/rI3jeMZ+dPe8MDPcwKMctbxdfJUbermSFmhV3ODhEufHSuiLSZopb7KEf0HKI6gtnzrxulLrDESM4aOF4IMYskhiXsqAuaOrB2AMEElkSi3RZVKtIVAPrTIIEqxJTRN4urjYGQ8jTrjA6UdWHUFlMV+9BuM3SsWWTLfoAIG9ZlafPUtWU0kb0bygU37lviNk8bx5f9XPANkEw9SMmG9iVzOp72LO7PGNuGnwLiClS+D20d+Vbz3tFliqwyx9m27WcZHzZnWpd9DVq2waDjOifdYSFunJ+N9nxn47yNc1q27oBxjPM2fNJhouGQdLRNfNBRN2TsAO2BY/Oy9etXPrmhD8exYkl8GBEDIZ9D4PiilSfg2NZikbU16Ep8RReY9kinsOP70MiioDkL5MN/qpUY+b70DhLjNv4C/Say5PHBcN8Nb/u91373FYttnV2Ss+KXxU91SD/4wWM8e7ofeMdb3v+oxz/l4unO6uNm8z7eoeghLpbYeJrGyUkZPzhlGy6N5wnJ/4UOvJ3kBm+c3AaXTVjwG2IUYhO+kOscBy+/ABeqMM121BeAaEdGLlc7brngExjCaCe42xAefAwEFKR9beGiXYoT7ZiwKUzoXv1m3wJvDUpVkglrmuY29i18BG9GLWywaJN94Yd2tClLYp0QhgDnk/5UMkIboMW2Qk3f6vsy3/RfljByWYvNyJYi2HZNg5AFkXjoYr/b+xLY3GCToo/wE7UQrpDfAKHWMUMd7REbMrVNrBfyZbyYDtQY/QSoqDlzU3F9tC2/UEQ7xIQsHJU6+SAmCNLuW7hSLp0jwwB1mm0S67ztDcYbrFbaB7NB+oWeiU9/TZ5/SBeDApOd/XV5PujHB2P49Lv+yC7kemEeMiRB/nrMdHM62z0+6A1u+NTDn3Lw6X/95t85jqdEe29/+9ujR+zFWVV03pxVe9zeWV8T/4P5u9df+ey/++vtkxc9dj7E/cLenkG3uzbv9FcwwA+RFYfIj5wZDnB+skbo8OkxEzCKYu0bnelcbDDTs23nZRI6igtaMPCaGYaNY5zVRScbClhoz8r9xIVLPkrQwkGos554AnhxoSJGNWVlEciwy3yHrDQhLX9qKGsWsPTtmFInUXSm7SPchZ4uAoM6yARrCRLWAaGmvN3npVg3YKXuh4PSH2RJD3miC2wiE2EOxC6R+WGw/Sv0JIswei+8UecKeNYvo8JZ6MC3RaE6kzr63MAWnY3zUrEnqDAoSJmHWdi0Oxb4pC8aDZ2aKJlmk/n4AxOw5M8DEXJzz6+/LvFvhoaH1HmZEUKCBbRZMMmBdnPpnNfT6oKakc0aSVsS5FdyYZR1IYcjzf46mAkiCeIHlZFg+aeVmBSxJIr7gnhCHn+F7q5ev39z59wvnnzTG1/xnD+KlTG1fZZuMKqf5QVnKk+EK7qXbT7vv//2sz/2juv/ane3u68zwtmERVKcSfN5z76GdfG1bY4Tuwt+3kEyBGA25w8wIIZKiNTzBLcLg8sWXd575tIoztNIbHHiy0R4qFGHnlcIMazlGzR7AFZ8LPHQp7Vn/sNOereXH7dLtPOo1K+wEws7tklzd0GxMV6xH2xX/gi6mxJtlr6SSRBRu5+wCbeJL3CJTATQoBPrxCl5gyeDhKMcTGqzhQOrIgwoxcJl/FZPnkX2ESMTmTx0hYyk2i87cQqcJhrEpYZobYXiUDVcOdOQAbvERXaghtyxV237pnY5xzZKV9FmPlAeK+B03rUaIZtsQAef4h8NlCDiAIxrp3QQ7nXtASePsE1yt00q9xvtUU7b5NNpS1KQuyNVMFIfaAQD9SkgANC1jRGowYh3ENuwJEdPSz7AcRTST0OmREiJJUEmRHs4xpIgEmF3NtvCrcKN2aB/orfn/N2XvfEVz61JENFl8cNszNm8jW9FR378159xyz+Ofnc8fSAeHD0463TXet0+ZobdEfIe7xNiZqhZYR80Z4dMhFxJ5bc/iyC/BWaaKp7lkDHc/G+V0TwI4Fkkd50So4RS6UCFXpLwQTt+3Ad1osn7xSZAyAlAEYbXV+HHFBC53CuJT7XRdVu0fSoc5cSysO2gTbK4pb7dfvChS4ACS4zkuWo4ardb8rJ1+0STRylxy/i2LNknInVrwRdtVYANOGs/hFmYYU6hagCbYnLyEU6zOplR1FCfwl9hesZk9J/1mZQFHAThg50sz3H6M511WDMvl5U7F/bJ1nc28WETDpNfCvDlVNuiI3SI4pXRYHh+yGfLv3DS8/rPRQkQrPWeWzeUI7JA4EOfvO/HohkgcOKpZyokXnrQWCLlsugMH3v9C0mQP6bNh/74EOB0c9zvbAxXD976ht973XO/S07rRhEoj00NCX9fD69UPOOFV//I7Z9a//nd6bmz3mB/t9PfgyS4grNSr1Qgr9nDMx0kQEuCTIRMiDDHmZsTnp3cmunxjFYyZJiBINQjLpWJTUYoPy5jFbNFypQkpTQc9SwU0Y6tJrzjeL1Qx6LaupZkIafYYRQ1iuRLlBTRrmyjYehtURZk2AROtoU+5Kypi0IyuiB5OELdwBU2yRay2HeqSzwxYUJ5uJUtFYX/ZXbChwMZNf1LVeiDlC8YL7Onm3Zb7lp9XWbTbifwUVMvu6ijIwFo1YFvidWvOJ8auvDHRlolRIrvAhOGTaOAldJ2u8SU/aQ+4mY6XZFyEbby64aydTr0BqZjT2DQy+YUbdFOLrRzgS33yWjz0ZTLjnsgMRMcCbZruEiETHjSso2YBTIZKgHGwzG2JMrfTuZfm7ffUEYSnGyOe/OTw+GeW97xb17x6Ce/5KKv2cK+ITD62qvdPZs3Z/XDMosH/u0887p//67ff8dj//WT9003u0/A48kzZD6eq/jwBEzXA0R2ykpOnelRR6EJTQ0Rap5/dqWarvGQDLHuSi2ySfIul8r1YafrosCpHbdJds6HL8mxYQ/kLvCoE0YKIk0mOfXORzvRfuAMkG0KN1IJFxtXlpgSFH3hEQg6tRM+UIdONZzRX6NQ5nLqAk+M5BKS0f9s73zIA89aMug5lJT+SgxUKtG2dC4zBbZL7APS9ku5ZEts2FYcz7wD4SnXtBeOBqcrxJQ45yUKXVFLTp8gbLbiB068953q4J1WGzTmhwV12hdQJqaE/uxj1xGXHAueWF1zjnUvybX7F4+Ns07geqYMG/XdtYaVAhLXERgzMuLA87092TrPBBa+RDNhwYZY04WeNd/741OeoCOxyZ4JzvSa7ZH2B2PsARk+JBMzQNL2qoR+GMSfEJ1PNsbd2YnhcO2f3/3kn3zEN73k4q87qYdjLr+cO1ELIsCzpZYyAryK/FvSFc9/7WtO3nroyvHs4LQ73Is53Bpmhqt4gAbLox0slcYSKR6i0eyQCylaJsVMUTRdQQYuUqkuaURdgWeND68pvmJh+dY6Q7lsZB2bPNMjKumJlQAb+CrlPNPli/qiBIai0AsLPmrB3Tf7WNqEXZLTCMUr0exTwxelLky4BQBsIGNbrKOUsLZcmMCWdiEDQCQ2hcjMIFBb5Apl2YZU1MUONaGyS6ZBFP2Qr8JW/riJApswk6jNB87rdt8oXiZrmSW2xPJ8bLRd7mRYEFD0P9hQn1kdDlg3y4ImBEXPcAWhD4s9bXqyb6mN/tEsgZr2FMf1yKbsPKCPsGh86wUavKsYQ6Nzm0x6sRJDOrA0YZSjTkdbHTW5EH5g1CdagOcnEq4dK8iQDO3OK2kmT0+geDCG9wX5Z+X4VyXsT8xtjXuzk8PRyi0f+NpnX/qk//jUr7slbgPBSS0egTjiNSBlBMpkeOVrXnXy5kPfN57un3WH+/BldLWHdwxxxmOZVE+T2pOkcy2XYnkUz9fMtWSK0LLm6a9kyKVT0pYUFXhtIMJJLxjV7IdvLB8bvhCbmrAG3vgSxxTMSybhnOa1RRlLtMcLOGaYpVygAi+edm5f+qKu5HkJO4yqhaJrvCUlnnbtUmJLv8vkbVn4KuWlTPsCp+12iY+2ZFt0LvF0VNjebRuEFo2I9AYoj1gtHAfvLDEOX+hrCDA0wo8NmW6Wq7BHQ2U/MqBFcWYVnWLDXqIPwZ9JbYmBzgpH4EpJNNXG0L/hImlQ4gXJUdcY/Jb9imNKX8vPVetHalMN5L7xehAnp00sr8uIn7VjbbNH1hb1zb5mm2gDNf6bPMssTuSpNz9BR0KMxMejrIdi+ICMEiBrviu4i99X24HZFmaCG8OVPbe976sOP+ypR7/lKTfUJOjnTatK50FLftazXDrAh3mkc8XzX4WZ4YErdycHkfv2TTvd9b7uGSIZ2qsV9kqFZoNIhF2+huizw5gZpnuIMVPk5esXW8wEeVHogGDDOi7gEIZMdrqICgzx+HCjmjSKcrCRSU770oerVYUPMd5GqSed+gWaA0LJt7HkAUltk2cblJWl9EOapW1nUmsz6Khl7zZt3+Eo/MqmAJFs6MKp14Jiwzr1veAJo26Zj6WyMGCNQluVaICMC5OOAi35mSTJSeigLW9ffmMjIwOHWfJTYrSTC5pARNfEe9OgM577rPML0tQa1fIrM1dA2JLrXJIDx6WKwPCXhE5kXZm7U9ttOBrN/c5O4+uDJp4AqLvaWDK1bnlbkrP7plMT0W/W4ZY4olxmcloBg//tRCihsGFDHGkORVYzEfLVCPOJGi/LYyYIVk+I4geR8TdWp1tTPBgzGK3f/t5H/7uHPPUXjvzbm2oSZPSXFx2m5aoqxZnGbKWz+hkvfu2Lbv/E4H/sTs5FMjww6XRXB/kBGl8m5SsVXBrlUikSnmheTlou5WyRNGutg/IqcBkPA3X8T1qqaDrxIc81sbwQw0pQ82Nu3BvkBtXSDXdIA06G85pMyzouNhtik8DseJ3KHTalroDJX+jUHpSsuSnbpki+SHgpxowQLYCWYsI+rNCW2gye9RLZMl+yc2NW6qPz7oaVlQInQYuP/VvWDjtk97QK5+F2UdTcn0KfhvZCFoEtRQsRSUojuE3HLTrsAl4J0tslgX57R8udLkUtefh1L9A2HLhlljXxUEMgWYY0BNSFymyDM9cLMhNIqVWZCJjB5a2AuNR8xjmsGZy3SpnFpJ04y35EgqO7kFuCi/5ZgqPO5MLpfiFlvF/I5Ifv46KZ/JgEx4CN8Z7g9qwz2ZwP+lv91f13/OnTf/HJz3jueY88UZMg433qsnicT409OzWWDLnv88Mv/V/fcdtHx78+3j1/OB/sRTJcw8wQP9DdG+HML+4Z+r3DmBW2l0gtGSL0TIq6ongYnNYR4aIm1KKR5FRL5LRdQJQnVUGHHS8g0hwk7x4LDFyaXeFTnfB2nY72Ss5W8A8AACtPSURBVLx6U9ibxd1vaUNfUbfRbZ/BJ6OWQTkoCxv6YLwxso2+h97xoWv4S5ggYu5AZ/goyBy0SIcjUzmnqvR5d/JoxWaAJdJ9Fg1Fk2jdQpOMYad9NkGJawRd6tIot9f2aSE0rIfTD8dy+8UIhG/ra3C5bvqxUC7KTGJbw2QPqU0omrrcJi1L3374IAVGFwEQ5t6vCWeEMD+0N6lj8eVAMgnpB3ocp3Bn6PDDc8Xx8kIf1NlHcQevB2ckt3uCmhVyZqjZIGeEmBkiCSIBgt7FV/Zd/MToyd6wf7K75wFbv/X7r//+52B/xuXqFhqpZUkE7HxYoqiidgQOY6p3bPoffvrXn/Cp9228abx13kXTzh78xQouk/KvVfD1Cr1jCDovlXJWiBuKuCBiuRQhL2eFkQBjlohm04wRlC4kYXJ/0sXql7NhYJeOJi4oNuMmlJPmZSaZ81mIdrJ7UdlXVkhGJyzuo2AlTm2I8020Bzbwmch9K01IB5Z903hAYXQ0GkK9oCOOctZlWSYTCk458BTYRCfC/DX64nhBtPF5hUByqf5mfdEAyNRv0G4iQMaLSjJiWGzGYHRsU++zCZGhVk1OKbwpXsCZkXt0rPVvwdD8mUFrm7Gxb9Z/k3Mb+5MCAUHIAkW+gZVd2lvhTW8WFMjGWVovnstJWbRniYk7YX0wjNmiPbCUtHWU66hDEcnNkPTEQis3Fm0yw8qYhvhvS5/Uxr1ATPWcZvJzGjNB/Lw2eFsKxV8WR/P84wA7k+50YzAY3tXZ/6DZj7/11T/wc/RUkyCjcPpix/X0uIpABGJ54Yff/OaLr33LjVdvnzxw+Xiyx+8brth9QyTDOT5419ASIu4Z2tIoa870mBS5NEqa4SfNRGQ1ZfGkqckJI84/qISVmDIr5cVuiTI0ZilziGyoRu2mUWd0Qakt4wnnJW34xBXgTLprYcvBPvpgg0fGlxT9U8+2WPTQQjAmcp1/o1anzMY66CBWhR+y7Fc8iBL7HX2hGzWDje2dbWmnlqjMosWm4KgBkbNFG/qLwrZzyUyWU2byLKOFy0DZVxgOpNmeCCuLsuU4ogMbOwneRR7p5DMQLihsKQltYQU/EW8dXLeIvqshAdig29OGOM60vB8SQEY8bS3ihpNYHY72A2H9EIqO5Mudu5dkG/dg1SD8EMb22RJ0bM/2Q07cl/Un+RBBvWHYG9LilMyMjzgo6dEvjp+hsAXO2rTXJjgDJE7JULPBMUC8L6gkqPuBg+72oD+8/ZZDDx2++Jpf+P43sRV12m/tiK+bU0bAjtMp1VXRjkAkQ8q/9QW/8l/uvLHz8vH43A5eup/Me1gq7a7gChzNu/gVGswMcRn5qxWaJfZwsrdmh0qAkOFfSo642sRL1qTVn9DbVem2duHKhBIdWV5OGgJ8gwoKjplUu7lcchO8vq3K3lQhTxh3Gn7kjPb4pPbMdIF3caoSPoyTpkkQxxLdIp/al8Y37ifpxVsciEjNFA7pp10sYVgcNUABIxwcyIdsuAnfNuBGonEuu4WxoU1k5tpKYFTmtSyKsyf8FY6Sg0DbPgUHNUkKSbg4azNFhEojANwf9t5w3Jp/g2rAhkCy5CoRBjKnBQ0yOTEsWZbwnzmjuDWTHMlsY7KEFBAy1NwV4SSjEwgokzAs2CoKVZATEtnWYK4XyIBhbkfRFBYpmpbHlnT0OfrJhviffklYzRxlxzfL0vKnEh8tmAA5A8RSKGeCthSKpvl6xBi/rn2yPxxsd1YPbP7JY552wfN/7siR6zAPxLfqo5xC1nKGEYjje4bwCmMEyuWG73r5r15+w9+dvHq8c+jiyWx91hnswdm/0u92VzCdGeKLZMwMmRBxfnKGiKdKbQZInoeAs0XW+ABTzg5NZjolR5JAGC3GeNjz8pKmoIlmUQJkjX/2P2wlJETFpFnXHEAKTIbggsR/8Nwb64Ph0raFTfI23nExmJ3Kl8aR0glpgr0UZJa4MHRsKmgDGdf2bTgOWO5KVYMxCUQcthQv0QqzD3S5LfkrdpCebLdpXRQxLRnVzY64TcPSnCzBxb4UrahtDcamLFRLfGoPCwjJop1wUSbRJtp82v6WmmVtyblA2W+WldaWUEySfbvPMPZIBWvHCZhsAAfeP1TpWKpJ9+UI7h/t85cUGcCX1w09bd0esZLfqCWHJGaA1HLWqJljngFyKRRPhGJyzBqvRszHeMt+Z9abbw36g9s7By7oH/2917z45exq+UWdfC1nFoHGaXBmJhWVI2DfvI6+852H/uZ1f/Pzm3eMnjuZHuzMuusT/D4pMtqoN+/gQRq9cI+/YFEuk4pm6sCHyQ8fzRaVpSJBwkSJkTUPlX9Akyp50pTNk44muGZwDcZSaSMZhj2M5NWxIVaN7AaxFTkHKXwIXdeqaBPwUrVMJj3HCXfplYaIsJVdYFCT5JZ7bGIOL0UxoQmkMO0ihgMPmi461sDAa+i5pGp9M0TI2UgeEL1JQlKnTZa33tdGQ7n/YUaJtdeybNiFLtuHRFFawJ4CF0YJn4jQeL1MbjLFI6FPjUuQRDSxEeNSmuNQSunA+NCTC/vknjIK0cGwFiYlLQKgCaUMLfYmCkV5PFwDn/TN468m0jFDWwyI+6JztYnZncmhk54Y0py8kbalULwECDWXR1HPplDo9QgmQDjexSxwczAc7HRG68ff/6BHHnzhbxx93v9lU+UXdPK1nHkE7PicOb4iWxEov4E980df8+9v+8jWfx2Pz7lkPF3DrUEsl3ZHmP7xidIhroZ4mMbuG+InanAhMRGC16ViSdGSI4d5DvRMkjxM/gkaNf9ZIYZU8CXWpQZImBIvP2FKN7ofArvkkxcpUCUmtZVblYhQFoE5IMhSbKjsoi+dmX+ZYWO4GDwoDZnRaZsdCpG9FPhCGIMTWy5NSz4GtWjDcDaIlj2mA5MG0n3KoPQecpeFkxaObOqHD6KlTLo0uEabzX6ZS23zQXG23OPk1w5OqXLHySgaQl3IwkFbJnSBS9bLZFRGAklAychFmLJmmY+mzL4WZQujDGP+crxMms8xaso26UsYxIincugtZNGuYwwJEOXxYetOu5z+NeOTPO4D0gfpSIKcCTIRIgFqSdTuBXY7XAbd7vS7O/3+4M6tved1/+d3vv7wVUe6F20dPnwYf2D8GG8k1nIvI1Ae+3vpoprhrEWWeDlieXR2zfyTa2+68q3/6a6bZy+dTg6NJvPVGZ4sxdU0QrbS3zXkcimChj93qPcL+VRpOyHaUqldmp4ImTB1qfKQ4YOrUwmM4VfScTl5aiQzWma2Ca1c+EZ4R7ovwdyCflG8MsYEDRGZGB+kaGhlFhLCgpaitQl9uKO6xEvuAxR1GmdIpBIe2CWLotk4gM4C4gpVYd/SleJEs313E7JcuzdURjmfAUbBR9aQMo9BBTzvX0a7A+27YoNNE7fgBSYmS5pskPqRe5BQ3g3wFLEYCAQFbRwBASQd5fRY7Qds2a10+sq87Q+8iwInGwo5u4uzpdi/ZBDdcQfRZojjfDHeGxFDOvNKlPAf8YraMMAJ6jbqh9NUcAaoWSiTHuWNh2HQBSS/PAvEMugulkG3B8PhJu4FTv70wZed+5LXvPi7PsBulV/Eyddy7yJg58G9s61WrQiUJ+WVv/SGL/3ke2/9qa3jwyumswM41Vfx9w1XcQF4QuxwhqgHafAnC5kYmfyKGaEvmeqibiyPFgmxSIC27BmH05Ok2CwzX9bplER90DB7IXyv3C7MgSPJyzaJSGWmsOMAYd/PF9SOkh2dRSEw+DByvi0OE6vLZGLdKfE2FkLCWBkjs8AYY1xAyOXuxGBnraWtTJptJ50GuzSncHGjxQJq8kWtS1h5PGJGm43DNUCtmEUwS7/tHlm8S0T23EwIITestm5mRzn0VkdUyi4ZvaytJTIepzBOrjOOqohFJMIMy7iIQfSKdeBj5m9oO8YlrkkDRaA1DMKs8r6Tx16n88t44STzpU/R1JUJEDxnfhgh8DY8XExwyxMLSR0ug/Je4NZgwGXQ1ZMfOXjR3qPX/LfveyPASICYBV5zDaaSyvwU1fJpRGDhdPs0fFVTRqCYHZL9th/7lW+64+Nbrxhv733cZLKOS2Bl2hmsQTNERuODNHqgBhcZ6JT8bOk080yQTC28jwiYrmbMFHVlBh81WwWdPiSDp9Qu3zxjDLzhiOSlakhVJogRJImItJIp8gWXnakL9FtoZRwya3NRL1CxWYYLWXIYRNE+RQ1cYAoF9dG/GMwFi03DQUbkZgpAQVoTCwKIm7LMZUqQ1KlC7n2KXuQ+hNtFLNujNLkTDYn9l8esW24vUGNTGCf5mdrSIGNtH8qkFNqmzJpxuzAv84FkprDTFrTjWOUE1mw/gQIsNS3QvgKD+MmPOyMOAj2s434tGbK/ZmcG+d4gl0At8VFPOX8hhsugXAKdopkx/ojFeNblDLA/xuMFd96x74LRL37zTz71lfyFGHap3gtkFD6zJc77z6zX6i1OVl0NuDiGR37oVc+781O7L5zs7vmS8XgND9SsTHv9VVwuSIhYMsW7h3jOhfcK+6BZM/lFzVkgedY8ZEGDTDzl8SEZNFMfaLK2aeFCLgAZw4c42SSBJNwxEuhsdgsR5ebJ5QISfCbFLA3phskNCIlMzt2zQSmjaU0t6ygLfBgFOICpNv+2dWE4kbCpj7YiIaUOLDhIDYjIs4eWHA7CJzW5yYbDwqgpJ2e7BqqpCm+FLUUOWojHgrHsKS37VzZCV6Yz28Ba3UzC1gnDGR3btmw5H91Ve7lhOHF8mEWCFB9CthW01eYvYm8JT5Otwo57kJMoFBE7+SLQP/Hwi/pFGZOfzQox6wMKM0DM/vgwjL8cj9N5gtkfZ4BIgAP8aFX/+J3r53R/+5KvuvCXfvn7nvVRAOsyKIPwWSp23n6WnFe3zZP36vnHVv/4R//ombdft/Wj4+21L5mMOUMczfSnnbpMiAM8p8I/8aQlU4wqfJ08zw7xciJ0EKkukqJknvCctiGJhxeXLk0o1wcVayVKo6nhJc6aGxsOyNulLzl1hrCK13fyETqzDF+EhIa1mWRvUhYbjRunViek/IZzSMtupLFJrSWT0xIapuGTvrKPtlnRqKsoYZdPldhsrw3c2D8Yqk3306yktOOWmjwVOgGsKetM051zpQfBJDd78ix53wu/pqI2UZlYInMnZSyNbmONz32h14wxuZ1TS9sT1PHJSbYvfQVt+2kYbu0c9zYkDvuydlr7tUSuRGdyzfh4ZCPxcX+09MlEqA+USHS+HIp7gfMuEyBngEiA/cGJu/afN3r9+Y970Kte84Jv/zj3uy6DMgqf3WLnxWe3jeodESjvH15z87V7f/en//zI8Rt3XrC9ObpsOt2LxRHMCPu4j4iEiFkishAfphng0uuDbiZD+2UZLJNidMnLpZEYcUg56mh4pt74nJxMpstW9jw8gXearGSsWSQwsuBtcIMWRAwP9J5pMyGfPYAiA6HkThPZwLkBxx7tDpWpmFHgQxWusjYZtIhAulgOwov1ozQgmqVMJCaR0Emzz14CUUiCTM2HoLnvp24n48O71SbnNveVGhx1N7HjT89370P++M1JuGV+TRbtCO9eQxZWwRsGHnEw2zJrJxBRt/u4nKevRltguH9qQxsJ3Gn4iJrioKOmCDSDJpH5UszUd8PZU55hTyzlTHLEA40kaLNJT36WCAGaIk9OEV0+DDNF8tvt9Oa7/cFgFwnw5M17Dg5+4+Kvvui1r7zymR+hdyyC4qK+CnZxFE1at5/5CCyel5/5NqrHIgJlQsTA0Hvmj7zqiruu33rR9mbvSXM+VDMbYdl0NO328EJ+d4CkiETYGeAKswdrYsmUr1Vw2Iv3D5uzRJgoe/Dw+kezSHYky5TIxIc8avq1yzokvMRpyUveKGoKnkovbUzIre3MiQqnLXFqrC0n37aJttlwUawfJmipHFVIC3LBv42KsglY7gIkISzazmRWZgpaDbiOaigoWxA0gVTnDggfIgLN+hQ+NGgbpuGiaDPkNltqNsVfUcltQAfwsgRXJtxl/sKJfkKNffbupq9R8su22/txKr6UFzTIvB/Wq6bPwBZ1dEZtU14kRMqgNx/UWQK0HYjEF0mR9wD54MsMYeL7gPho9rcz6HfxqEB/qzNc2frI2gNWXv/l3/joq48+/RtvVlxqArQwfA63PEdr+TxEoEyIbP47j7766+/86Mb3bN41f+psvu/c6WQVl03fZ4lMiJwl8p4hZ4dMinoBHxcYEiLkkRgtIfKwUs669VmQERIY0MK3aqoX5IUs9BwXRFPH0mBMtEReouiiLNTZMFRK7ynd9prtkyYRoVsQhKKom5gYP7U/6niZDgozkgTHjhduSotQCy5zB7KS/6yRurExbEAz0uRp0gOFtWPycJGtTZKaYyIoislxhCAuNZF8MrTUmjQw8kF1THwSFH69YcaFZC4JBFEkOGpDHjVFQS/W5tPlOiagG3jqQsb+oC3pTc57fikZKilixqf7gHw3EDNAvg+I+39Y/sTujfvDIRZ9uid2Ruuzd+07f+Xqr3vh17z5RQ9//HE4sSXQY3gSNAWC0lo+FxFonlufixZrG40ItBPiD/zqmy781N/e/K1bt+1+985m/7LZbF9nOuUPeY9whcUL+fwNU0uK/i4ieM4Qmfyi5qG1p0xtBlckRqrmtrQaw6CeIrWbiVASEKeGffcNXqYYnUxrOsmSBKYoMWyZrrTWsGIDnJDmSaTsDMthJmypCxTl97qE8d06C9BiK01NwRVktjIht8ubswgJFaDEZC9NKg/4groyjlAav71NQ+f2DV5alhLIqSqDLnUb3+QN3pSVXlNeyoSpF3y3fTivigkIBqBNatt22xGH1D5hKbmaTXho1oWuTHLRRyU798VlTyQ8xlbtWSLkrA8JUk+AQq6HYPDgC2eAO4NBf9rp93c6g5Wd69fOGf7uwS/af/Vvvuz577d+1nuAEYfPZ81zqZb7QAT8kWhekboq8a1z8KyXve6JJ27ceObmXZOnTcfrF85mmCVOMRvsjfBOIpIjX7/QPUQ8ZIOkZ0mxl5OiEiMPsSdIJTpevpQxmaH22WDIpHKcjYoMjuFFgeQbIhLZhmIUYqIUNP1zj5IoEQH2+lTyFqzBtm1iQGvLU1CtH4CV3bIEwgggNjQNN422yJSKSDOUw4gq2dJ5hpJkyZZBhYHpbUtZ6M1nE8U2TRJ+aRc9acpMwzzQ3Cfa88MSFsGbNG9b8jLTZhCoFu40PPsb+cnc0D58sE9BUxs666v96Ddk+C+kdjBCHna5NivnU//JZ0xug2KeB6FnbcucxNiysM8A8dQndwIPvaAJzvogn0/x2gPo+e6g151g6RP3Ansnt1f39t++57zV37nkmy992898wzfcBqcq9SGYiMTnv7bz5PPfj9qDFIF59/DhY71jx47wa6XKT7zlLed++C8+9Y0bt+0c3jk5u3w6XT+gpDjjU6YDfEXFk6e4n4irDmM57yn2kas4Y+RTp54EWXPo0IyRl7rx9qALT4PWRwmSzYc8aK+TviUny9LINPRBWdqI5YZDDcUcfmwAorSkyGecccEbzuxN4y2Joe9mWZQ09U2O42b4s36afXgpdbTM/QhE4S9EAgVT6J1UkmiJA938KwclKBAWl6zJ8iwjBXmoUqdD0EbyyJSliSOno9AQNxg3bstK3ukkAhH98kSXexAgq61vLsMBMyr6bHw+m6j1j4DEEZPl5o9JLWSR+AxrSY/v+xGAGSCSH58CxV+I7/e7+BEpvPvX7W5Mh+vzv91zYPjWBz7iC976upd+x4dy/4/2jh7Vu4B0XMt9JALNc/w+0qnaDYuAzRJJH00XzQ/92m899Lr33va0jVu3v2V3o/Pl8/n6ObPZGu5C6Kfa8CrG0JMiEyKXP/2+oiVEyHjILTnacMEEVC6TUk+Y18KzD0ycLJSz8lq80RpbWvpIb5oBAMY2iTYsveVhKuRWc5tLyYWtaZv+ssU9o+jT2vDBFALlcq/pTe06sByfrb/SnqbRjAlfsV/m1tt2L+bX+hWakKWGNGCDW1QkSJPIfchyk9GVDqvYU+NoR631vY0zXnqR1nPDhmXYL7clKp8hJEsc6cxbImNfQmZ1foCnxAeNWjuLs1G+C7n8WCLkcqcBueRJmnLN/pj80OSkP+gx+fEp0I2d4drsQ+v7V/7o0MV73/pr//l7/wZfMmnEgi+31/SOXXMY16auBJPW7X0mAvn8vM90qXZkIQKY3x0+olmirszQf+/PvvbBd940ecLm7TtP2zo5vnw2WblgNsW7iUiKU9wDxBIqfq9J9xORLSwxWnLU+4m4+jHs+T1FS1B2T9FGQ54a/tHoWPDqAIcemFPsS6kxkFJuJWp6sqFKEhhx6GGRnEyCJkL65iZ0DYMmZAkXbYWKXkoPoQ95qWzI6CAJ3Jv48OCyVmXaHJVlbVuPijDQB4DLbJvuDdGUuXFRZf0yfFNGznaz1WdPSKE3n2abPWSbUi8aIKZFO2coyVanpw3LM8e74fbRXvgqa9L4SOS0GNg0EqBdVvANEJMdeftYAuSsD7r5bq/XmfT6fJabM7/+1uZovfuutYMrf7Dv/L3/52lXPe9DR7pd/KFAK1z6vPTSS+f4QktntdyHI8DzvZb7UwSUFI9g6bT5a/MvfctbHviJv7zhCdt3bH/D9snZk8Y73Ud05uvdGV7HmHK22O3j2yhni0qI/PUaHHvO8vyjmSOHKPIYEnwJ1YZEiDV68XQpPwyc8Xyn0bhIcsZTH5q4tRhDlwxca7R5aNIaxSAKf1nblhEZqDZNK+qWyakJnY+ahN+7EqM04pFnJcvbjUiVDZV7a3OpQhvKJFoQuKaQk1RQClnYS4dNoVKiCn2qDVDAYJOPouQ+RdZpEDFo2RtbenG/hS9kKO9PxjFOjpSL4HMyozjwrOPDXXcabdi+MSdBxj6iLf6+J5IeIkQB90kPulCGB104E5xoybPXA93FX38YjG9a2dt758re0Z+e9/AHvb257Ml+1KVPRuH+VnSJ3N86XfsbEZh3jx59OT5HceHy6rbyh/P5yv/+qVc/+uRN46/duGObSfFfTceD8zvzNSTFAS5xJMZ5DykV9xd7A+SnPqePSI5Kijgn8JXXEiGGCkuMkSCXJkRPkuyApZQ4rayOIbN88d5G58Cx34ENqtRlPSm1QzUI+hbSeelBp/GUNP5xmBMavNGtdiQXiMBPo6h3so+kYhIfvr0JNIe+G6P+aU8oQzGlEGR9DxxtEkdKZzsURt4A99l90oJSSwrkopTY0GdZClSrZbMOXPZlbZBHy2D8u5HDHZ8OTGm/jIaMYiUreTQ/EHJPTUI6bIknnWW2/574iJPeEh9mejK09/tAY8kTf/uv1+vywxVMPumJ3/rs75wcrHT+bmVP/x17D6782SOe9NB3H73iilvVBd/UmV8ZjfsnbefU/bPvtddlBJDWjr6cSZHC5lLMD77hzRfc9Pf//LiNmzaeON7qPGF3Y/pIzBQf0OlyGXWAJ1G5AMSnTgd4GpW/ZtPDGKYHbZQI7RdsOIPkd3CkMyRJG454+vjHk2Hi03BliUr4NDLGaRc1+xx01KXMaI5c1MbMkpxGM6pZggHI02MSy06cbwpsKU50agySskthl4AtAliNt0mcDaIP4S5rAmySpG8AGkwYeH0qnctLtTpRCsJVW3Y3PFVMaFFEFnw6EAQsk7usYWdnFJOXFavtCBeyFFzKyg+t6AOJj+IukxsJJDXKpKMIv/GJdRItf+IeH3T4IUPc5+NvVsy3cXbvbvSH80+M9g//3/qB/l+e99AD73z1Dz73H+CgKEd7hw9f2z1W3/krYnL/JuOau3/vRe39QgT4oM211z4KF+uR+EosDJbrui/45d+88Pbr77xkstv7yq3bth4/nfS+bGdrdnGvt6c3ndiMkT8JjISIn8TAcipnhT0lQmRCZDN7IlVDC0YcFgw5mjlCh1NKmYqnVvPDYclkXgsrId0E0aqdhS+Nb/RJKBjzR1OzDZ4WNvEwrGmBdwDxGUvKHaqm9d2XsCCKA3ckXVsKDV+LPsLO2ja7PPAbPqxTn4ueigwA4aLN2/LWFqU5arHXhX0iE+EOSr6kqS74CLCsQh61u0p47j8LI8AkZJ4WEp9jqE261A59c2bHE45C+sHpKmc67aGgXjM+kJM+bvLhKx4TH/VY6hxObhuu9Dnje/fa/pV3js4bXftlz370J19y0ddsqWnfpFnfVVehkfJbQImq9P01AnYu3l97X/t9hhGIJVTCj3IEaJSjb33rwU++7/glt91061dMNjuXjbfGX47l1IfOO6MD8+kIwwvuM/JHMjAUYeaIgaWPr9F4RUM//4asosyCEcZnisqGTI5KiJxZ8jQrP2zeTj36tCRo6US8emd6kY7NNjSxYTGjMoUOwgJ6IxreKMol2jTPTV1GnY4qmklt5t7YEC0fFAJsupwCG1hAHObNnqpXS+SpIyBcnX0twQfIW1LFoEWHaIIxP7FyEXz0P/u1tozn0TFz10sZ2LIuafYAvA5cbsd2hjgqPOmB5NloSY9yzvxQ66nOKU46/mIEEh5OV7u/t4vTc3fc68+uG+1dfX9vMH33oQcffM++A4MP/soPf88n2XKr2JOex/CkpxppaSv7LyoCcY7/i9qpujOni4AlxmUzRloig/Ve+tt/eNF17/qnSyaT3uO279x+7HS3+6jppPNFk93ugW4Pf0YKD+Dwo+GIzxroYZw+BiTdX0SG4VikJAmPHBZ9xqhBBXINr6x4CvLDQhyTE+soTT1UNi7KrsQYTTuz57aUkS79ujJVTXwS30si+h99oBuTxQDPOKNHAFifvXZDr6D3hOOCtPtFhAJrXc3+o+uektQD2cvArMIfsYxO+GrS7Jv5FQIgCz+IMFBjZEpByRc0d7zAsw9mFxgC2B6SnqbZZPX9jQQ+WK/Ai+zoC/QT3NMDFk74oMsAS5ydzg4/O6O14fV40vOfVs9Ze3+/P3vvuQ974Ae/8llP/vCVF164yRabJR5yuQoO4LCWsyoCdg6eVbtcd3YxAmVi/CAGgcVZI8aj0Qt+9jUXbu2MLrnrpjses3Ni9ij8ss0jd0/sPAS/g3poPhusAoIBaYgHcjAk4eE7f/IU/vCyFe49cqiyIZTDFhIlKo04fNVDI6s2JY547y5qx5vEbUt92rGwCYHxbCtsQ6P2xbgGVRqnA1ToG6JPi8ktB2U9aDq1PgcCfYNaOBHYuCrJZe5C0CVV+o+Ul2UZyQBkf4U8eQtZu2aDlJmcR5N5jLy1YzRk+IrEmR2BSHDA6MiTlQEF/I8aP1uGv9/nMzzO7vjqAmNAO7yp0OcfsR3fPlof3DQc9T+E29wfOPCFh66djU/8/dd/79ddf+XDLrsL7bQLZnuHe/Zqw1VotCa+doDONj5fB2fbntf9vfsIYKziwzfXXsuHAi7FYLE0OfZe9Mqrz8VfznjgrR+7/aLhaM8lmyc2vmS8MX44Xuy/eHdr/AWz6WBNf4B4incbZ1it4pd4DGNeY2TDMquWW/UAjpIjTkqMTPiezyFKyY+nqX9sxMQgKN6ncaCB9WSq/SJrNiIKmnbLSjOxEhV/GUHjM9q1sRsKNqcG1EH1zPpq3UjerRPOBlO2H7JkcTdEgSWZ3IAJlWSutA6aP47zgZGkwUCSebqwPyMkytDwJdfJT+DLOtEgSFulGa36Yj545JX82Iz+a0kTFJLdfNbjQoKdCXxyE0lvyFzIGd7ueLA+uKU3n32itzL7+PqhfR+cbe/+455zVz62duGBG7/wMeNbj17+nG11uLnREmenc6xT3+lrBqZyOQI6vzNbqRqBu4tAOXM8wtFO61XLLH75vX9+8D1vft/5ndmeB29vbD1045bNL+71Vy6eTKcP2T0x/gLMJs/p9oZrcyTIub3niMGwh+VWePNkqZEQSZJzA1tyZRbkKcusZDU7YdnQTmUfsiUtsgXtOAKzlofQZTxMVMyPg2xMp1xi1xnQtuxAlITJQusfAEGgFgksO1QW7lLItHvOtGBusihl8zaX8+4CkpK5rNxGFTZmICt3uoyWF+sajwRbMD+5j+T1kYLJThhsMHODKT88qPzgwWQtBnB2x1b1rp4tGHTG4/l45/hwz+Cm0frqx2e7W9et7B99ZO+5Bz/SmW1+7EGXHrzxF5797Nvx5Yg/5bKspJkelUfrgy3LYlRlSyLAS6GWGoFPIwKWHOnAXt0QdcoESe2Pv+1t5xy/cfdBd374hvOO37L5kMFg7eLpbHzx1m2bD8Ey6wN6g+EDpuPpOdPdzjp+RxW3G/ED43j3kUmSt4oseXHe4LRGXSTLLh/kwViLERr/RIO3zKflVwk5Jtt5z4pOxAVtKpPCB8f+QkSSJs1CWzaXgE31PeLgJ/rUbkiNh7DsSciioZJPNAj9Zzy0S5asLJqGMlrZjq60T5bTjKE9TBla6pTcLMlx19kjuMaWszl8dcESJu/f4Xc4cdzwsEp/OhmuDu4Ec0tntnvryv6160ero+smk93rVtY6HzvnYRfcePDgwZue+t3rt17evfxUyQ7+jyqFxvl29OhVaJSdqqVG4N5FgOduLTUCn/kIaMBkcuTy6qNwnh3r4NdwNN+7u8Ywlxj+9J/92aF/+Kv3Hdg9ObpwMFp/4ObGxkWbN5+8sDMfXNAbDh+Av25zPp5sPWeyMzvQ64/4Btg6bhZhXNYPBWAo5jjJD3kOxDZuz/gkvWU9VBg4MVqjmxSC1tgKGuN8Smg2rKPzSIbYEokCUtNL51TRsHkxNTnDnm7LBtp23mgybfHcOXYzxDDnXgWrXePuFxIFRP50ONggPsyNCAOPmwpoKrDRx2dx+ibCRMcPfm2lgxfP8RMsu/gVlm28lrA93Du8HX936Basg980nW7ftn5o7fqVfftuxJG4fnd8681fdNkjbz3yrKffflm3u+SBFWvZt2j5KGZ4j+peeinvW/Ncuoo7m3etAa9MjcC9j4Cf9PfeQbWsEbjHEfDBNu5B0t7vQ3KQO+1Ad838nWtv+5m3r092Dx5YGe1f3b5r49DWibvWZ1vzCwajfft7w+65uzvjC8fb4/XdjZ0Lep3R3u6gvwbPD8CscnU6m63Mdqfr3U7556v4BAaSoZZn+b51XBpMK7aHVps80kX01iDQOdjSiKTYtAfv8E190tHYGvItUeZBSYoZWslJ0lCiJskSNWlmRuZHyYiRrXWF9+H4PUAr25hi42EUkHy6CcuUA7xlPhpsAIIf1uzdMZtOjs8nuzvdtf4/r66v3jVYGd6GON0w397YmHcnN66ds3Ji9ZyDd2LGd2K6devml37bZcdf+tinbKM9ODxdsZkdX07HX+XDPbwPzuty5uliVvWfjQiU185nw3/1WSNwzyOARMkkGYb3ZEYZNmWN2dDwTzqd0V+85Y/3337djSvHbzs+HJ8Ynz8c7NnTG62tTCbTQ9OdrUOT3eloZ3uyMjm5eUGvh+TZGw3wquQIg/pePECyHzPRNeQ5vEA572Hpdm26s3MOkkK/O8cCIED4xR2mHPxED6ejrPGDrpppxq7kOqiyn6SZntIEj0mVQCYrf30ACY5/8weZET+RgoIMZjSmu+ju8f5oeBLdwJ9G6MzQs51ur3cSs+Pj8+nuNtaWx6h3e6v9m4drq3fhKcvJYGXleG+0gp8Mm2x0Tm7tdvrbtx54yN7j6wcOTh/zrY8/8VUHH7L5qE5njJ1j1+5JQRdsRkejNKur9+3uSQwr9nMUgVNdj5+j5mszNQL3NgI2J+PSa3g4SkIbElGOcv3v0y7KPVhrfU/nPd33wNuNb3vP8IYPdw4Mp3tHo/5qf9qb97vDYW8yww+4gp5Nx6PJ1nRlPt4eTceT4Ww27Y4n80EXP+OjznACxl+yY+HdsAFyHlIbV3hZ4G02wB9g7vZm88FwddwdDnZ7cN8fjraQkqY9/jLeBD+VMp1h8gqns61pf3jyrie+8EHbd3QeOr+k8xXzr0cyRAL7jOw/uqTExr5FiXt05G3ZMjT3OGmGYa1rBD4vEUiDyOel9dpojcDnKgJx78vP+DKB2owzd+TYMb1LSUHMgqLOoPsXFdc5k1mH993K7sdsLWQpqXGv7/lMMNzUukbgfhOBxgVxv+l17WiNwH0iAjYrTekSfSqXdKOL7UQb8jOt24mKdrqXFg7SVVxnYhGSWtcI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjUCNQI1AjctyLw/wF6dzhFr0+chAAAAABJRU5ErkJggg=="></image>
						<text id="XCULE-USER">
							<tspan x="70" y="26">${localStorage.getItem('userName').toUpperCase()}</tspan>
						</text>
					</g>
				</svg>`,
				title: '',
				items: [
					{
						title:'🐞 Report a Bug',
						onSelect: ()=> window.location = 'mailto:support@xcule.com'
					},
					{
						title: '👋 Logout',
						onSelect: ()=> tvWidget.showConfirmDialog({
							title: 'Logout?',
							body: 'Are you sure want to logout?',
							callback: (r) => {
								if(r){
									localStorage.removeItem('userName')
									localStorage.removeItem('xtoken')
									localStorage.removeItem('userID')
									window.location.reload(false);
								}
							}
						})
					},
				],
				tooltip: 'Profile'
			})
			
		});

		return () => {
			tvWidget.remove();
		};
	}, []);

	const startOverlayListener = () => {
		var isDragging = false;
		var isMouseDown = false;
		var dragStartX = 0;

		const iframe = document.getElementsByTagName('iframe')[0];
		const iframeWindow = iframe.contentWindow;
		const iframeDocument = iframeWindow.document;
		const chartWrapper = iframeDocument.querySelector('.chart-gui-wrapper');

		const removeExistingOverlays = () => {
			const existingOverlays = chartWrapper.querySelectorAll('.overlay');
			existingOverlays.forEach(existingOverlay => {
				existingOverlay.remove();
				try {
					iframeDocument.removeEventListener('mousedown', updateMouseDownDrag);
					iframeDocument.removeEventListener('mousemove', updateMouseMoveDrag);
					iframeDocument.removeEventListener('mouseup', updateMouseUpDrag);
					iframeDocument.removeEventListener('click', removeOverlayListener);
					document.removeEventListener('click', removeOverlayListener);
				} catch (e) {
					console.log("###e: existing overlay remove :>", e);
				}
			});
		}
		removeExistingOverlays();

		const overlay = iframeDocument.createElement('div');
		overlay.className = 'overlay';
		chartWrapper.appendChild(overlay);
		
		const removeOverlayListener = event => {
			const replayActionButtonCloseContainer = document.querySelector("#replayActionButtonMenuContainer");
			let replayNavButton;
			try {
				replayNavButton = iframeDocument.querySelector("#navbar-replay-button").parentNode.parentNode;
			} catch (e) {
				console.log("Exception on replayNavButton: ", e);
				replayNavButton = false;
			}

			if ((chartWrapper.contains(event.target) && !isDragging && !isMouseDown) || replayActionButtonCloseContainer?.contains(event.target) || replayNavButton.contains(event.target)) {
				try {
					chartWrapper.removeChild(overlay);
					iframeDocument.removeEventListener('mousedown', updateMouseDownDrag);
					iframeDocument.removeEventListener('mousemove', updateMouseMoveDrag);
					iframeDocument.removeEventListener('mouseup', updateMouseUpDrag);
					iframeDocument.removeEventListener('click', removeOverlayListener);
					document.removeEventListener('click', removeOverlayListener);
				} catch (e) {
					console.log("###e: overlay listener remove :>", e);
				}
			}
		};

		const updateOverlayPosition = event => {
			const onReplayMode = RM.ReplayMode.get('replay');
			if (onReplayMode) {
				if (chartWrapper.contains(event.target)) {
					const distanceToRight = chartWrapper.getBoundingClientRect().right - event.clientX;
					overlay.style.width = distanceToRight + 'px';
				} else {
					overlay.style.width = '0px';
				}
			} else {
				removeExistingOverlays();
			}
		};

		const updateMouseDownDrag = event => {
			isMouseDown = true;
			dragStartX = event.clientX;
		};

		const updateMouseMoveDrag = event => {
			updateOverlayPosition(event);
			if (isMouseDown && !isDragging) {
				const xDiff = Math.abs(event.clientX - dragStartX);
				if (xDiff > 5) {
					isDragging = true;
				}
			}
		};

		const updateMouseUpDrag = event => {
			if(isDragging) {
				const xDiff = Math.abs(event.clientX - dragStartX);
				if (xDiff > 5) {
					isDragging = true;
					isMouseDown = true;
				} else {
					isDragging = false;
					isMouseDown = false;
				}
			} else {
				isMouseDown = false;
			}
		};

		iframeDocument.addEventListener('mousedown', updateMouseDownDrag);
		iframeDocument.addEventListener('mousemove', updateMouseMoveDrag);
		iframeDocument.addEventListener('mouseup', updateMouseUpDrag);
		iframeDocument.addEventListener('click', removeOverlayListener);
		document.addEventListener('click', removeOverlayListener);
	};

	const onBarReplayWidgetClose = () => {
		buttonReplayMode.innerHTML = `<span class="navbar-replay-icon-container"><img class="replay-icon" src="/assets/replay.svg">Replay</span>`;

		if (RM.ReplayMode.get('replay')) {
			DataFeed.cleanReplayStuff(true)
		} else {
			setBarReplay(false)
		}
	}

	const getQMLValues = (tvWidget) => {

		let { interval, symbol } = tvWidget.symbolInterval()
		let totalBars = tvWidget.activeChart().getSeries().barsCount()
		let toTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		let toastID = toast.loading('Loading QML Values...')
		console.log("TO CANDLE TIME: ", toTime)

		axios.get(`http://127.0.0.1:8080/getQML/?symbol=${symbol}&tf=${interval}&barCount=${totalBars}&to=${toTime}`)
			.then(function (response) {
				// handle success
				console.log("QML VALUES", response.data)
				let qmlevels = response.data.lines.reverse()
				drawQMLevels(tvWidget, qmlevels, interval)
			})
			.catch(function (error) {
				// handle error
				console.log("API==>", error);
			}).finally(() => {
				toast.update(toastID, { render: "QML", type: "success", isLoading: false, autoClose: 2000, icon: "👌" });
			})
	}

	const drawQMLevels = (tvWidget, qmlevels, interval) => {
		let groupId
		const grpName = 'QML'
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		qmlevels.map((it, i) => {
			if (it.hasOwnProperty("x1") && it.hasOwnProperty("x2")) {
				if ((totalBars - it.x1) > 0) {
					const shapeId = tvWidget.activeChart().createMultipointShape(
						[
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1 },
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0], price: it.y2 }
						],
						{ shape: 'trend_line', overrides: { "linecolor": it.color == 0 ? '#FF5252' : '#4CAF51', "linewidth": 2 }, lock: true, disableSelection: false, showInObjectsTree: true, disableSave: true })
					if (i == 0) {
						tvWidget.chart().selection().add(shapeId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						tvWidget.chart().selection().remove(shapeId)
					} else {
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					}
				}
			}
		})
	}

	const getDFXTValues = (tvWidget) => {

		let { interval, symbol } = tvWidget.symbolInterval()
		let totalBars = tvWidget.activeChart().getSeries().barsCount()
		let toTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		let toastID = toast.loading('Loading DFXT Values...')
		console.log("GET DFXT DATA: ")

		axios.get(`http://127.0.0.1:8080/getDFXT/?symbol=${symbol}&tf=${interval}&barCount=${totalBars}&to=${toTime}`)
			.then(function (response) {
				// handle success
				console.log("DFXT VALUES", response.data)
				let indicatorName = 'DFXT'
				let linesValues = response.data.lines.reverse()
				let boxesValues = response.data.boxes.reverse()
				let labelValues = response.data.labels.reverse()
				drawIndicatorLines(tvWidget, linesValues, interval, indicatorName)
				drawIndicatorBoxes(tvWidget, boxesValues, interval, indicatorName)
				drawIndicatorLabels(tvWidget, labelValues, interval, indicatorName)
			})
			.catch(function (error) {
				// handle error
				console.log("API==>", error);
			}).finally(() => {
				toast.update(toastID, { render: "DFXT", type: "success", isLoading: false, autoClose: 2000, icon: "👌" });
			})
	}

	const drawIndicatorLines = (tvWidget, linesValues, interval, indicatorName) => {
		console.log("DRW DFXT LINES")
		let groupId = null
		const grpName = indicatorName
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		// const lastBarTime =  tvWidget.activeChart().getSeries().data().bars().last().value[0]
		const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - 2)[0]

		linesValues.map((it, i) => {
			if (it.hasOwnProperty("x1")) {
				if ((totalBars - it.x1) > 0) {
					const shapeId = tvWidget.activeChart().createMultipointShape(
						[
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1 },
							{ time: it.x2 ? tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0] : tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0] + (20 * tfDiffer), price: it.y2 }
						],
						{ shape: 'trend_line', overrides: { "linecolor": '#000000', "linewidth": it.width ? it.width : 1, "linestyle": it.style == 'solid' ? 0 : 1 }, lock: true, disableSelection: false, showInObjectsTree: true })
					if (i == 0) {
						tvWidget.chart().selection().add(shapeId)
						groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
						tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
						tvWidget.chart().selection().remove(shapeId)
					} else {
						tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					}
				}
			}
		})
	}

	const drawIndicatorLabels = (tvWidget, labelValues, interval, indicatorName) => {
		console.log("DRW DFXT LINES")
		let groupId = null
		const grpName = indicatorName
		// const totalBars = tvWidget.activeChart().getSeries().barsCount()
		// const lastBarTime =  tvWidget.activeChart().getSeries().data().bars().last().value[0]
		// const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars -2)[0]

		labelValues.map((it, i) => {
			if (it.hasOwnProperty("y") && it.hasOwnProperty("x")) {
				// if((totalBars - it.x1) > 0){
				shapeId = tvWidget.activeChart().createMultipointShape(

					[
						{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x)[0], price: it.y }
					],

					{
						shape: 'text', text: it.text, zOrder: 'top',
						overrides: { 'fontsize': 7, "textColor": "#000000", 'color': '#000000', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
					})
				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					tvWidget.chart().selection().remove(shapeId)
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
				}
				// }
			}
		})
	}

	const drawIndicatorBoxes = (tvWidget, boxesValues, interval, indicatorName) => {
		console.log("DRW DFXT BOXES")
		let groupId = null
		let shapeId = null
		// let textId = null
		const grpName = indicatorName
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		// const lastBarTime =  tvWidget.activeChart().getSeries().data().bars().last().value[0]
		const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - 2)[0]


		// console.log("===>", tfDiffer, lastBarTime)

		boxesValues.map((it, i) => {

			if (boxesValues[i].y1 !== undefined && boxesValues[i].y2 !== undefined) {

				if (it.hasOwnProperty("x1")) {

					shapeId = tvWidget.activeChart().createMultipointShape(

						[
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1 },
							{ time: it.x2 ? tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0] : tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0] + (20 * tfDiffer), price: it.y2 }
						],

						{
							shape: 'rectangle', text: `${indicatorName}`, zOrder: 'bottom',
							overrides: { "backgroundColor": '#FFFF00', "linewidth": 0, "transparency": 50, "textWrap": "none", "textVAlign": "center", "fontsize": 20, "textHAlign": "right", "extend": 'none', "color": '#FFFF00' }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
						})
				}


				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					// tvWidget.chart().selection().add(textId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					tvWidget.chart().selection().remove(shapeId)
					// tvWidget.chart().selection().remove(textId)
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					// tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
				}
			}
		})
	}

	const getFVGValues = (tvWidget) => {

		let { interval, symbol } = tvWidget.symbolInterval()
		let totalBars = tvWidget.activeChart().getSeries().barsCount()
		let toTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		let toastID = toast.loading("Loading FVG Values...");
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
			}).finally(()=>{
				toast.update(toastID, { render: "FVG", type: "success", isLoading: false, autoClose: 2000, icon: "👌" });
			})
	}

	const drawFVGLevels = (tvWidget, fvglevels, interval) => {
		let groupId = null
		let shapeId = null
		let textId = null
		const grpName = 'FVG'
		const totalBars = tvWidget.activeChart().getSeries().barsCount()
		const lastBarTime = tvWidget.activeChart().getSeries().data().bars().last().value[0]
		const tfDiffer = tvWidget.activeChart().getSeries().data().bars().last().value[0] - tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - 2)[0]


		console.log("===>", tfDiffer, lastBarTime)

		fvglevels.map((it, i) => {

			if (fvglevels[i].y1 !== undefined && fvglevels[i].y2 !== undefined) {

				if (it.hasOwnProperty("x1")) {

					shapeId = tvWidget.activeChart().createMultipointShape(

						[
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0], price: it.y1 },
							{ time: it.x2 ? tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x2)[0] : tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0] + (20 * tfDiffer), price: it.y2 }
						],

						{
							shape: 'rectangle', text: 'FVG', zOrder: 'bottom',
							overrides: { "backgroundColor": fvglevels[i].bgColor == 1 ? '#FDE5E7' : '#D9FFEB', "linewidth": 0, "transparency": 20, "textWrap": "none", "textVAlign": "center", "fontsize": 20, "textHAlign": "right", "extend": 'none', "color": it.bgColor == 1 ? '#FF0000' : '#00FF00', "width": it?.width }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
						})

					textId = tvWidget.activeChart().createMultipointShape(

						[
							{ time: tvWidget.activeChart().getSeries().data().bars().valueAt(totalBars - it.x1)[0] + (18 * tfDiffer), price: (it.y1 - it.y2) / 1.7 + it.y2 }
						],

						{
							shape: 'text', text: 'FVG', zOrder: 'top',
							overrides: { 'fontsize': 7, "textColor": "#000000", 'color': it.bgColor == 1 ? '#FF0000' : '#0B9981', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
						})
				}


				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					tvWidget.chart().selection().add(textId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					tvWidget.chart().selection().remove(shapeId)
					tvWidget.chart().selection().remove(textId)
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
				}
			}
		})
	}

	const settingUpTfMarker = (interval, v) => {
		var temp = smcTfMarker
		smcTfMarker.map((it, index) => {
			if (it.title == interval.toString()) {
				temp[index].val = v
			} else {
				temp[index].val = 0
			}
			setSmcTfMarker(temp)
		})
	}

	const getValuesFortheChart = (tvWidget, intervl) => {

		let toastID = toast.loading("Analysing...")
		let { symbol, interval } = tvWidget.symbolInterval()
		settingUpTfMarker(intervl ? intervl : interval, 1)
		axios.get(`http://127.0.0.1:9000/history?symbol=${symbol}&tf=${intervl ? intervl : interval}&depth=${valueDepth}`)
			.then((response) => {
				console.log("SMC", response.data)
				let smclevels = response.data.levels.slice(-30).reverse()
				let dzlevels = response.data.zoneD.slice(-25).reverse()
				let szlevels = response.data.zoneS.slice(-25).reverse()
				let boslevels = [...response.data.bosLL.slice(-30).reverse(), ...response.data.bosHH.slice(-30).reverse()]

				setSMCLevels(response.data)

				manageRangeBeforeAndDraw(tvWidget, smclevels, dzlevels, szlevels, boslevels, intervl)

				settingUpTfMarker(intervl ? intervl : interval, 2)
				//METHOD ONE
			})
			.catch((err) => {
				return err
			}).finally(() => {
				toast.update(toastID, { render: "Gotcha!", type: "success", isLoading: false, autoClose: 2000, icon: "👌" });
			})
	}

	const manageRangeBeforeAndDraw = (tvWidget, smclevels, dzlevels, szlevels, boslevels, interval) => {
		tvWidget.activeChart().setVisibleRange(
			{ from: smclevels[smclevels.length - 1].time, to: smclevels[0].time },
		).then(() => {
			const drawMsLevelsCall = drawMsLevels(tvWidget, smclevels, interval)
			const drawDZLevelsCall = drawDZLevels(tvWidget, dzlevels, interval)
			const drawSZLevelsCall = drawSZLevels(tvWidget, szlevels, interval)
			const drawBOSLevelsCall = drawBOSLevels(tvWidget, boslevels, interval)
			console.log("ON THE FLY")
		}).finally(() => {
			tvWidget.activeChart().restoreChart();
			console.log("EVERYTHING ALRIGHT")
		});
	}

	const drawMsLevels = (tvWidget, smclevels, interval) => {
		let groupId
		const grpName = 'Market Structure'
		smclevels.map((it, i) => {
			if (smclevels[i + 1] !== undefined) {
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[smclevels[i], smclevels[i + 1]],
					{ shape: 'trend_line', overrides: { "linecolor": '#000', "linewidth": 0.5 }, lock: true, disableSelection: false, showInObjectsTree: true, disableSave: true })
				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					tvWidget.chart().selection().remove(shapeId)
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
				}
			}
		})
	}

	const drawDZLevels = (tvWidget, dzlevels, interval) => {
		let groupId = null
		const grpName = 'Demand Zones'
		dzlevels.map((it, i) => {
			if (dzlevels[i + 1] !== undefined) {
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[{ time: dzlevels[i].timeA, price: dzlevels[i].priceA }, { time: dzlevels[i].timeB, price: dzlevels[i].priceB }],
					{ shape: 'rectangle', zOrder: 'bottom', overrides: { "backgroundColor": '#D9FFEB', "linewidth": 0, "transparency": 40 }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true })
				const textId = tvWidget.activeChart().createMultipointShape(

					[
						{ time: (it.timeB - it.timeA) / 2 + it.timeA, price: (it.priceB - it.priceA) / 2 + it.priceA }
					],

					{
						shape: 'text', text: `${interval + " " + 'DZ'}`, zOrder: 'top',
						overrides: { 'fontsize': 7, "textColor": "#000000", 'color': '#0B9981', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
					})
				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					tvWidget.chart().selection().add(textId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					// tvWidget.activeChart().sendBackward(shapeId)
					tvWidget.chart().selection().clear()
					// tvWidget.chart().selection().clear()
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
				}
			}
		})
	}

	const drawSZLevels = (tvWidget, szlevels, interval) => {
		let groupId
		const grpName = 'Supply Zones'
		szlevels.map((it, i) => {
			if (szlevels[i + 1] !== undefined) {
				const shapeId = tvWidget.activeChart().createMultipointShape(
					[{ time: szlevels[i].timeA, price: szlevels[i].priceA }, { time: szlevels[i].timeB, price: szlevels[i].priceB }],
					{ shape: 'rectangle', zOrder: 'bottom', overrides: { "backgroundColor": '#FDE5E7', "linewidth": 0, "transparency": 40 }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true })
				const textId = tvWidget.activeChart().createMultipointShape(

					[
						{ time: (it.timeB - it.timeA) / 2 + it.timeA, price: (it.priceB - it.priceA) / 2 + it.priceA }
					],

					{
						shape: 'text', text: `${interval + " " + 'SZ'}`, zOrder: 'top',
						overrides: { 'fontsize': 7, "textColor": "#000000", 'color': '#FF0000', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
					})
				if (i == 0) {
					tvWidget.chart().selection().add(shapeId)
					tvWidget.chart().selection().add(textId)
					groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
					tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
					// tvWidget.activeChart().sendBackward(shapeId)
					tvWidget.chart().selection().clear()
				} else {
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
					tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
				}
			}
		})
	}

	const drawBOSLevels = (tvWidget, boslevels, interval) => {
		let groupId
		const grpName = 'BOS'
		boslevels.map((it, i) => {
			const shapeId = tvWidget.activeChart().createMultipointShape(
				[{ time: boslevels[i].timeA, price: boslevels[i].price }, { time: boslevels[i].timeB, price: boslevels[i].price }],
				{ shape: 'trend_line', zOrder: 'bottom', overrides: { "linecolor": '#000', "linewidth": 0.5, 'linestyle': 2 }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, text: "BOS", disableSave: true })
			const textId = tvWidget.activeChart().createMultipointShape(

				[
					{ time: (it.timeB - it.timeA) / 2 + it.timeA, price: it.price }
				],

				{
					shape: 'text', text: `${interval + " " + 'BOS'}`, zOrder: 'top',
					overrides: { 'fontsize': 7, "textColor": "#000000", 'color': '#000000', 'fixedSize': false }, lock: true, disableSelection: i == 0 ? false : true, showInObjectsTree: true, disableSave: true
				})
			if (i == 0) {
				tvWidget.chart().selection().add(shapeId)
				tvWidget.chart().selection().add(textId)
				groupId = tvWidget.activeChart().shapesGroupController().createGroupFromSelection()
				tvWidget.activeChart().shapesGroupController().setGroupName(groupId, `${interval + " " + grpName}`)
				tvWidget.chart().selection().remove(shapeId)
				tvWidget.chart().selection().remove(textId)
			} else {
				tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, shapeId)
				tvWidget.activeChart().shapesGroupController().addShapeToGroup(groupId, textId)
			}
		})
	}



	return (
		<>
			<div
				ref={chartContainerRef}
				className={'TVChartContainer'}
			/>
			{barReplay && <Draggable>
				<div className="positioner">
					<div id="replayActionButtonMenuContainer" className="menu hide">
						<div className="menu_item">
							<input className="toggle" name="menu_group2" id="sneaky_toggled" type="button" onClick={(e) => onBarReplayWidgetClose()} />
							<div className="expander">
								<label htmlFor="sneaky_toggled"><i className="menu_icon fa fa-close"></i></label>
							</div>
						</div>
						<div className="menu_title">
							Replay
						</div>
						<div className="menu_item">
							<input className="toggle" name="menu_group2" id="sneaky_togglea" type="radio" onClick={(e) => RM.ReplayMode.set('replayPause', false)} />
							<div className="expander">
								<label htmlFor="sneaky_togglea"><i className="menu_icon fa fa-play"></i> <span className="menu_text">Playing</span></label>
							</div>
						</div>
						<div className="menu_item">
							<input className="toggle" name="menu_group2" id="sneaky_toggleb" type="radio" onClick={(e) => RM.ReplayMode.set('replayPause', true)} />
							<div className="expander">
								<label htmlFor="sneaky_toggleb"><i className="menu_icon fa fa-pause"></i> <span className="menu_text">Pause</span></label>
							</div>
						</div>
					</div>
				</div>
			</Draggable>}
			<ToastContainer
				position="top-right"
				autoClose={2000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light"
				progressStyle={{ backgroundColor: "#0B9981", color: "#0B9981" }}
				/>
				<ToastContainer />
		</>
	);
}


const x_smc_icn = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="25px" height="25px" viewBox="0 0 48 45" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Artboard</title>
    <g id="Artboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <image id="1457857" x="0.5" y="5.5" width="34" height="34" xlink:href="data:image/png;base64,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"></image>
    </g>
</svg>`