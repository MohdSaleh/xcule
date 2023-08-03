import axios from 'axios';
import {subscribeOnStream, unsubscribeFromStream} from "./Socket";
import RM from '../components/TVChartContainer/DFcallsManager'
import { ToastContainer, toast } from 'react-toastify';


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

const lastBarsCache = new Map();
const dataFeedCallBack = new Map();

let userClient
let currentSymbolonChart
let historyBars = [];
let replayBackBars = [];
let intervalID;
// let pendingReplayBarsToGo = [];

export default {
    // get a configuration of your datafeed (e.g. supported resolutions, exchanges and so on)
    dataFeedCallBack,
    cleanReplayStuff,

    onReady: (callback) => {
        // console.log('[onReady]: Method call');

        const value = localStorage.getItem('xtoken')
        if(value){
            const config = {
                headers: { Authorization: `Bearer ${value}` }
            };
                    axios.get(`http://127.0.0.1:8080/login?username=${'tugoftrades'}&password=${'toc__123'+'#'}`, config)
                    .then(function (response) {
                        // handle success
                        // console.log(response.data);
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
            // alert('Welcome Back! Login to access Xcule')
            toast.info('Welcome Back! Login to access Xcule', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                });
            
        }
    },

    // NO need if not using search
    searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
        // console.log('[searchSymbols]: Method call');
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
        // console.log('[resolveSymbol]: Method call', symbolName);
                // onSymbolResolvedCallback({ ..., has_no_volume: true})
                axios.get(`http://127.0.0.1:8080/resolveSymbol/?symbol=${symbolName}`)
                .then(function (response) {
                    // handle success
                    const i = response.data
                    
                    i.ticker = i.legs[0]
                    // i.name = i.legs[0]
                    // i.timezone = "Asia/Kolkata"
                    i.supported_resolutions = configurationData.supported_resolutions
                    // i. has_seconds = true
                    // i.seconds_multipliers = ["1S", "5S", "15S", "30S"]
                    i.intraday_multipliers = ['1', '5', '15', '30', '60', '120', '240']
                    i.has_daily = true
                    i.daily_multipliers=['1']
                    i.has_weekly_and_monthly = true
                    i.weekly_multipliers=['1']
                    i.monthly_multipliers = ['1']
                    // i.visible_plots_set = false


                    const symbolInfo = i

                    // console.log("SYMBOL INFO AFTER", symbolInfo)
                    // console.log("=================>>>",symbolInfo, "<<<=================");
                    onSymbolResolvedCallback(symbolInfo)
                })
                .catch(function (error) {
                    // handle error
                    onResolveErrorCallback(error)
                    console.log(error);
                })
    },
    // get historical data for the symbol
    getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback, subscriberUID) => {

        const rMode = RM.ReplayMode.get('replay')
        const rModeFrom = RM.ReplayMode.get('replayFrom')
        const rPlayRange = RM.ReplayMode.get('replayRange')


        if(currentSymbolonChart !== symbolInfo.ticker+resolution){
            historyBars = []
            replayBackBars = []
            // console.log("BAR HISTORY CLEARED")
        }

        if(rMode && replayBackBars.length == 0 && rPlayRange){
            // console.log("REPLAY MODE ON && NO REPLAY BACK BARS")
            // console.log("===========> BARS", historyBars, "==> REPLAY BARS", replayBackBars, rPlayRange)
            replayBackBars = historyBars
            replayBackBars = replayBackBars.slice(0, -rPlayRange)
            onHistoryCallback(replayBackBars, { noData: false });
            lastBarsCache.set((symbolInfo.full_name).toString(), { ...replayBackBars.reverse()[replayBackBars.length - 1] });
            return;
        }

        // if(pendingReplayBarsToGo.length > 0 && !rMode){
        //     alert(2)
        //     onHistoryCallback(pendingReplayBarsToGo, { noData: false })
        //     lastBarsCache.set((symbolInfo.full_name).toString(), { ...pendingReplayBarsToGo[pendingReplayBarsToGo.length - 1]});
        //     cleanReplayStuff(true)
        //     return;
        // }

        if(!rMode && rModeFrom !== null && rModeFrom <= Date.now() ){
            // console.log("REPLAY MODE OFF && REPLAY FROM TIME EXPIRED")
            // alert(rModeFrom)
            RM.ReplayMode.set('replayFrom', null)
            const barReplayState = dataFeedCallBack.get('barReplayState')
            onHistoryCallback(historyBars, {noData: false})
            // historyBars = []
            // RM.ReplayMode.set('replay', true)
            barReplayState(false)
            // console.log("CHART RESETING PROCESS COMPLETED......100%")
            return;
        }

        currentSymbolonChart = symbolInfo.ticker+resolution
        // console.log(currentSymbolonChart, "CURRENT SYMBOL ON CHART")
        axios.get(`http://127.0.0.1:8080/getBars/?symbol=${symbolInfo.ticker}&tf=${resolution}&range=${periodParams.countBack}&to=${periodParams.to}&usr=${userClient.session}`)
        .then((response)=>{

                if(!response.data.length){
                    // console.log("NO DATA ON REQUESTED TIME")
                    onHistoryCallback([], { noData:true })
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
                     
                     historyBars = bars.concat(historyBars)

                     onHistoryCallback(bars, {noData:false})
                    //  console.log(`[getBars]: returned ${bars.length} bar(s)`);
                     

                    if (periodParams.firstDataRequest) {
                        lastBarsCache.set((symbolInfo.full_name).toString(), { ...bars[bars.length - 1] });
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
        var rMode = RM.ReplayMode.get('replay')
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
            var rPauseMode = RM.ReplayMode.get('replayPause')
            // const rModeTicker = RM.ReplayMode.get('replayTicker')
            // const rModeTF = RM.ReplayMode.get('replayTF')
            // let rModeBarCallBack = RM.ReplayMode.get('replayBarCallBack')
            
            if(rPlayMode){
                axios.get(`http://127.0.0.1:8080/getReplayBars/?symbol=${symbolInfo.ticker}&tf=${interval}&range=${rPlayRange}&to=${rModeFrom}&usr=${userClient.session}`)
                .then((response)=>{
                    // console.log("====>",response.data)
                    let rbars = [];
                    response.data.map(i => {
                            rbars = [...rbars, {
                                time: i.time * 1000,
                                open: parseFloat(i.open),
                                high: parseFloat(i.max),
                                low: parseFloat(i.min),
                                close: parseFloat(i.close),
                                volume: parseFloat(i.volume)
                            }];
                    });
                    // console.log("<==>", rbars)

                            let pendingBars = rbars
                            // console.log("BEFORE SHIFT", pendingBars)
                            pendingBars = pendingBars.slice(1) // your code puts strings into this array
                            // console.log("AFTER SHIFT", pendingBars)
                            // pendingReplayBarsToGo = [...pendingBars];
                            var curBarIndex = -1;

                            intervalID = setInterval(function() {
                                // dataFeedCallBack.set('restReplaySimulation', onResetCacheNeededCallback)
                                rPauseMode = RM.ReplayMode.get('replayPause')
                                if (!rPauseMode){ 
                                    ++curBarIndex;
                                    if (curBarIndex >= pendingBars.length) {
                                        // curBarIndex = 0
                                        cleanReplayStuff(true)
                                        // console.log("SHAKKALAKKA BOOOM BOOM", pendingReplayBarsToGo.length)
                                    }else{
                                    // console.log("---->", curBarIndex, pendingBars[curBarIndex].time/1000, new Date(pendingBars[curBarIndex].time))
                                    onRealtimeCallback(pendingBars[curBarIndex])
                                    lastBarsCache.set((symbolInfo.full_name).toString(), { ...pendingBars[curBarIndex] });
                                    // pendingReplayBarsToGo.shift()
                                    // if(curBarIndex == 0 && pendingReplayBarsToGo.length < 2){cleanReplayStuff(false)}
                                }}
                                // if(curBarIndex <= pendingReplayBarsToGo.length - 1 && !rPauseMode){
                                //     lastBarsCache.set((symbolInfo.full_name).toString(), { ...pendingReplayBarsToGo[curBarIndex] });
                                // }
                                // onRealtimeCallback(pendingReplayBarsToGo[curBarIndex]);  // set new news item into the ticker
                            }, 500);
                })        
            }

        }
    },

        // вызывается для отписки от стрима
    unsubscribeBars: (subscriberUID) => {
        // console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
        unsubscribeFromStream(subscriberUID);
    },

    getServerTime: (callback) => {
        const d = Date.now()
        callback(d / 1000)
    },
};

function cleanReplayStuff(reset){
    // alert(5)
    RM.ReplayMode.set('replay', false)
    RM.ReplayMode.set('replayPause', true)
    RM.ReplayMode.set('replayRange', null)
    RM.ReplayMode.set('replayFrom', Date.now())
    RM.ReplayMode.set('replayStart', false)
    const cbReset = dataFeedCallBack.get('restCache')
    let tvC =  dataFeedCallBack.get('tvWidget')
    if (tvC.chart().isSelectBarRequested()){
        tvC.chart().cancelSelectBar()
    }
    clearInterval(intervalID)
    // pendingReplayBarsToGo = []
    replayBackBars = []
    // historyBars = []
    if(reset){
        cbReset()
        tvC.chart().resetData()
    }
    tvC.applyOverrides({'mainSeriesProperties.showCountdown' : true, 'mainSeriesProperties.showPriceLine': true, 'scalesProperties.showTimeScaleCrosshairLabel': false}) 
    // console.log("CHART RESETING PROCESS......50%")
}
