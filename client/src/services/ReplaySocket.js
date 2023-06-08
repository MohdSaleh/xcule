import { io } from "socket.io-client";

const channelToSubscription = new Map();
let ticker
let tf
let socketID
let play

// const socket = io(`ws://127.0.0.1:8888/`);

function getNextDailyBarTime(barTime) {
    const date = new Date(barTime * 1000);
    date.setDate(date.getDate() + 1);
    return date.getTime() / 1000;
}

const socket = io(`http://127.0.0.1:8888/`,{});

socket.on('connect', (sockett) => {
    // console.log('[socket] Connected', socket.id);
    socketID = socket.id
});

socket.on('disconnect', (reason) => {
    // console.log('[socket] Disconnected:', reason);
});

socket.on('error', (error) => {
    // console.log('[socket] Error:', error);
});


export function RsubscribeOnStream(symbolInfo,
    interval,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback,
    resolution,
    lastDailyBar
) {

    ticker = symbolInfo.ticker
    play = subscriberUID
    tf = interval
    const handler = {
        id: subscriberUID,
        callback: onRealtimeCallback,
    };

    const channelString = subscriberUID

    let subscriptionItem = channelToSubscription.get(channelString)

    if (subscriptionItem) {
        // already subscribed to the channel, use the existing subscription
        subscriptionItem.handlers.push(handler);
        return;
    }

    subscriptionItem = {
        subscriberUID,
        interval,
        lastDailyBar,
        handlers: [handler],
    };
    // todo

    channelToSubscription.set(channelString, subscriptionItem);
    socket.emit('join', { uid: subscriberUID, ticker: symbolInfo.ticker, tf:tf });
    // console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
}

export function RunsubscribeFromStream(subscriberUID) {
	// find a subscription with id === subscriberUID
	for (const channelString of channelToSubscription.keys()) {
		const subscriptionItem = channelToSubscription.get(channelString);
		const handlerIndex = subscriptionItem.handlers
			.findIndex(handler => handler.id === subscriberUID);

		if (handlerIndex !== -1) {
			// remove from handlers
			subscriptionItem.handlers.splice(handlerIndex, 1);

			if (subscriptionItem.handlers.length === 0) {
				// unsubscribe from the channel, if it was the last handler
				// console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
				socket.emit('leave', {uid:subscriberUID, sid:socketID});
                // socket.close()
				channelToSubscription.delete(channelString);
				break;
			}
		}
	}
}

socket.on('feed', (data) => {

    const channelString = play
    const subscriptionItem = channelToSubscription.get(channelString);
    if (subscriptionItem === undefined) {
        return;
    }
    const i = data.live
    const tradeTime = parseInt(i.time)*1000

    const lastDailyBar = subscriptionItem.lastDailyBar;
    // const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

    let bar 

        bar = {
            time: i.time * 1000,
            open: parseFloat(i.open),
            high: parseFloat(i.max),
            low:  parseFloat(i.min),
            close: parseFloat(i.close),
            volume: parseFloat(i.volume)
        };


    // console.log('[socket] Update the latest bar by price',channelString, bar.time," CLOSE: ", bar.close);
    subscriptionItem.lastDailyBar = bar;

    // subscriptionItem.lastDailyBar = bar;
    subscriptionItem.handlers.forEach(handler => handler.callback(bar));
});