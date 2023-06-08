import axios from 'axios';
import {subscribeOnStream, unsubscribeFromStream} from "./Socket";
import {RsubscribeOnStream, RunsubscribeFromStream} from "./ReplaySocket";
// import { io } from "socket.io-client";
const io = require('socket.io-client');
import { useEffect, useState } from "react";
import RM from '../components/TVChartContainer/DFcallsManager'
// console.log("IO", io)

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

const configurationData = {
	supports_marks: false,
	supports_timescale_marks: false,
	supports_time: true,
	supported_resolutions: supportedResolutions
}

// const liveFeeds = ({subscribeUID, symbolInfo, interval}, callback) => {
//     // const live  = SubscribeBarsData(subscribeUID, symbolInfo, interval)
//     // return live
//     const socket = io(`ws://127.0.0.1:8888/`,{
//         query: {
//             "symbol": symbolInfo.ticker,
//             "tf": interval
//         },
//         transports: ["websocket"],
//         autoConnect: false
//     });
//     // socket.open()

//     // socket.emit('join', {uid : subscribeUID + "====client====="});

//     socket.on("error", (error) => {
//         console.log("SOCKET ERROR ", error)
//     });

//     // socket.on('feed', (data) => {
//     //         const i = data.live
//     //         // console.log(data.live)
//     //         const candle = {
//     //                     time: i.time * 1000,
//     //                     open: parseFloat(i.open),
//     //                     high: parseFloat(i.max),
//     //                     low: parseFloat(i.min),
//     //                     close: parseFloat(i.close),
//     //                     volume: parseFloat(i.volume)
//     //                 }
//     //         return callback(candle)
//     // })

//     return socket.open(()=>{
//         return socket.on('feed', (data) => {
//             callback(data.live)
//        })
//     })

// }
const lastBarsCache = new Map();
const dataFeedCallBack = new Map();
let userClient
let getBarResponse 
let symbolInfoResponse
let historyBars = [];

export default {
    // get a configuration of your datafeed (e.g. supported resolutions, exchanges and so on)
    symbolInfoResponse,
    getBarResponse,
    dataFeedCallBack,

    onReady: (callback) => {
        console.log('[onReady]: Method call');

        const value = localStorage.getItem('xtoken')
        if(value){
            const config = {
                headers: { Authorization: `Bearer ${value}` }
            };
                    axios.get(`http://127.0.0.1:8080/login?username=${'tugoftrades'}&password=${'toc__123'+'#'}`, config)
                    .then(function (response) {
                        // handle success
                        console.log(response.data);
                        userClient = response.data
                        setTimeout(() => callback(configurationData), 1000)
                    })
                    .catch(function (error) {
                        // handle error
                        console.log(error.message);
                        alert(error.message)
                        localStorage.removeItem('xtoken')
                        window.location.reload(false);
                    }) 
        }else {
            alert('Welcome Back! Login to access Xcule')
        }
    },

    // NO need if not using search
    searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
        console.log('[searchSymbols]: Method call');
        axios.get(`http://127.0.0.1:8080/searchSymbol/?searchKey=${userInput}`)
            .then(function (response) {
                // handle success
                // console.log("RESOLVE SYMBOL RESPONSE: ", response.data);
                const sym = response.data.map((i)=>{
                    if(i.exchange == "FXCM"){
                        return {
                            "symbol": i.symbol,
                            "ticker": "FX:"+ i.symbol,
                            "full_name": i.id,
                            "description": i.description,
                            "exchange": i.exchange,
                            "type": i.type
                        }
                    }else{
                        return {
                            "symbol": i.symbol,
                            "ticker": i.id,
                            "full_name": i.id,
                            "description": i.description,
                            "exchange": i.exchange,
                            "type": i.type
                        }
                    }
                })
                // console.log("RESOLVE SYMBOL RESPONSE: ", sym);
                onResultReadyCallback(sym)
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })

    },

   // retrieve information about a specific symbol (exchange, price scale, full symbol etc.)
    resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
        console.log('[resolveSymbol]: Method call', symbolName);
                // onSymbolResolvedCallback({ ..., has_no_volume: true})
                axios.get(`http://127.0.0.1:8080/resolveSymbol/?symbol=${symbolName}`)
                .then(function (response) {
                    // handle success
                    const i = response.data

                    i.ticker = i.legs[0]
                    // i.name = i.legs[0]
                    // i.timezone = "Asia/Kolkata"
                    i.supported_resolutions = configurationData.supported_resolutions
                    i.intraday_multipliers = ['1', '5', '15', '30', '60', '120', '240']
                    i.has_daily = true
                    i.daily_multipliers=['1']
                    i.has_weekly_and_monthly = true
                    i.weekly_multipliers=['1']
                    i.monthly_multipliers = ['1']
                    // i.visible_plots_set = false


                    const symbolInfo = i
                    symbolInfoResponse = symbolInfo
                    dataFeedCallBack.set('symbolInfoResponse', symbolInfo)

                    console.log("SYMBOL INFO AFTER", symbolInfo)
                    // console.log("=================>>>",symbolInfo, "<<<=================");
                    onSymbolResolvedCallback(symbolInfo)
                    dataFeedCallBack.set('resolveSymbol', onSymbolResolvedCallback)

                })
                .catch(function (error) {
                    // handle error
                    onResolveErrorCallback(error)
                    console.log(error);
                })
    },
    // get historical data for the symbol
    getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback, subscriberUID) => {
        let replayBackBars = []
        const rMode = RM.ReplayMode.get('replay')
        const rPlayRange = RM.ReplayMode.get('replayRange')
        
        if(rMode && !replayBackBars.length){
            console.log("===========> BARS", historyBars, "==> REPLAY BARS", replayBackBars, rPlayRange)
            replayBackBars = historyBars
            replayBackBars = replayBackBars.slice(0, -rPlayRange)
            onHistoryCallback(replayBackBars, { noData: true });
            return;
        }
        var rModeFrom = Date.now()/1000
        if(rMode){
            rModeFrom =  RM.ReplayMode.get('replayFrom')
        }
        console.log("===========> REPLAY MODE", rMode, "<=================")

        axios.get(`http://127.0.0.1:8080/getBars/?symbol=${symbolInfo.ticker}&tf=${resolution}&range=${periodParams.countBack}&to=${rMode ? rModeFrom : periodParams.to}&usr=${userClient.session}`)
        .then((response)=>{

                if(!response.data.length){
                    console.log("NO DATA ON REQUESTED TIME")
                    onHistoryCallback([], {noData:true})
                    return;
                }else{

                    let bars = [];

                    response.data.reverse().map(i => {
                            bars = [...bars, {
                                time: i.time * 1000,
                                open: parseFloat(i.open),
                                high: parseFloat(i.max),
                                low: parseFloat(i.min),
                                close: parseFloat(i.close),
                                volume: parseFloat(i.volume)
                            }];
                     });
                     
                     historyBars = historyBars.concat(bars)
    
                     console.log(`[getBars]: returned ${bars.length} bar(s)`);
                     

                     dataFeedCallBack.set('getBarResponse', bars)
                     dataFeedCallBack.set('getBars', onHistoryCallback)

                     onHistoryCallback(bars, {noData:false})


                    if (periodParams.firstDataRequest) {
                        lastBarsCache.set((symbolInfo.full_name).toString(), { ...bars[bars.length - 1] });
                        // console.log("lastBarsCache....", lastBarsCache.get(symbolInfo.full_name))
                        // console.log(`[getBars]: requested ${periodParams.countBack} returned ${bars.length} bar(s)`, symbolInfo.ticker, resolution);
                    }

                }
        })
        .catch(function (error) {
            // handle error
            console.log('[getBars]: Get error', error);
            onErrorCallback(error);
        }) 
    },
    // subscription to real-time updates
    subscribeBars: (symbolInfo, interval, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, resolution) => {

        // console.log('[subscribeBars]: Method call with subscribeUID:', subscriberUID, lastBarsCache.get(symbolInfo.full_name));
        dataFeedCallBack.set('restCache', onResetCacheNeededCallback)
        const rMode = RM.ReplayMode.get('replay')
        if(!rMode){
            subscribeOnStream(
                symbolInfo,
                interval,
                onRealtimeCallback,
                subscriberUID,
                onResetCacheNeededCallback,
                resolution,
                lastBarsCache.get(symbolInfo.full_name)
            );
        }else{
            const rPlayMode = RM.ReplayMode.get('replayStart')
            const rPlayRange = RM.ReplayMode.get('replayRange')
            const rModeFrom =  RM.ReplayMode.get('replayFrom')
            if(rPlayMode){
                axios.get(`http://127.0.0.1:8080/getReplayBars/?symbol=${symbolInfo.ticker}&tf=${interval}&range=${rPlayRange}&to=${rModeFrom}&usr=${userClient.session}`)
                .then((response)=>{
                    console.log("====>",response.data)
                    let bars = [];
                    response.data.reverse().map(i => {
                            bars = [...bars, {
                                time: i.time * 1000,
                                open: parseFloat(i.open),
                                high: parseFloat(i.max),
                                low: parseFloat(i.min),
                                close: parseFloat(i.close),
                                volume: parseFloat(i.volume)
                            }];
                     });

                            var newsArray = bars;   // your code puts strings into this array
                            var curNewsIndex = -1;

                            var intervalID = setInterval(function() {
                                ++curNewsIndex;
                                if (curNewsIndex >= newsArray.length) {
                                    curNewsIndex = 0;
                                }
                                onRealtimeCallback(newsArray[curNewsIndex]);   // set new news item into the ticker
                            }, 1000);
                })        
            }

        }

        // const liveFeeds = ()=> {
        //     SubscribeBarsData({subscribeUID, symbolInfo, interval}, (i) => onRealtimeCallback({
        //         time: i.time * 1000,
        //         open: parseFloat(i.open),
        //         high: parseFloat(i.max),
        //         low: parseFloat(i.min),
        //         close: parseFloat(i.close),
        //         volume: parseFloat(i.volume)
        //     }))
        // }
        // liveFeeds(subscribeUID, symbolInfo, interval)
        // let a = liveFeeds({subscribeUID, symbolInfo, interval}, (cb) => cb = a )

        // console.log("LF", a)
    },

        // вызывается для отписки от стрима
    unsubscribeBars: (subscriberUID) => {
        console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
        unsubscribeFromStream(subscriberUID);
    },

    getServerTime: (callback) => {
        const d = Date.now()
        callback(d / 1000)
    },

    // getQuotes : (symbols, onDataCallback, onErrorCallback) =>{

    //     // symbols(['BINANCE:BTCUSDT'])
    //     const q = {
    //         "s": "ok",
    //         "d": [
    //             {
    //                 "s": "ok",
    //                 "n": "BINANCE:BTCUSDT",
    //                 "v": {
    //                     "ch": 0,
    //                     "chp": 0,
    //                     "short_name": "BTCUSDT",
    //                     "exchange": "",
    //                     "original_name": "BINANCE:BTCUSDT",
    //                     "description": "BINANCE:BTCUSDT",
    //                     "lp": 173.68,
    //                     "ask": 173.68,
    //                     "bid": 173.68,
    //                     "open_price": 173.68,
    //                     "high_price": 173.68,
    //                     "low_price": 173.68,
    //                     "prev_close_price": 172.77,
    //                     "volume": 173.68
    //                 }
    //             }
    //         ],
    //         "source": "BINANCE"
    //     }

    //     onDataCallback([q])
    // }
};


// function liveFeedData(symbolInfo, interval){
//     var socket = io(`ws://127.0.0.1:8888/?symbol=${symbolInfo.ticker}&tf=${interval}`);
//     socket.on('feed', (event)=>{
//         console.log('Client Connected...', event);
//     })
// }