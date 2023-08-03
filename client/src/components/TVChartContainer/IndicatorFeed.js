import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useIndicatorSocket = () => {
  const [socket, setSocket] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const newSocket = io('http://192.168.43.217:9001'); // Replace with your server URL
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleDataReceived = (data) => {
      console.log('Received indicator data:', data);
      // Handle the received data here
    };

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('indicator data', handleDataReceived);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('indicator data', handleDataReceived);
    };
  }, [socket]);

  const handleSubscribe = (symbol, to, indicator, timeframe) => {
    if (!socket) return;

    socket.emit('subscribe', {
      symbol,
      timeframe,
      to,
      indicator,
    });

    setSubscriptions((prevSubscriptions) => [
      ...prevSubscriptions,
      { symbol, to, indicator, timeframe },
    ]);
  };

  const handleUnsubscribe = (symbol, to, indicator, timeframe) => {
    if (!socket) return;

    socket.emit('unsubscribe', {
      symbol,
      timeframe,
      to,
      indicator,
    });

    setSubscriptions((prevSubscriptions) =>
      prevSubscriptions.filter(
        (subscription) =>
          subscription.symbol !== symbol ||
          subscription.to !== to ||
          subscription.indicator !== indicator ||
          subscription.timeframe !== timeframe
      )
    );
  };

  useEffect(() => {
    subscriptions.forEach((subscription) => {
      const { symbol, to, indicator, timeframe } = subscription;
      handleSubscribe(symbol, to, indicator, timeframe);
    });

    return () => {
      subscriptions.forEach((subscription) => {
        const { symbol, to, indicator, timeframe } = subscription;
        handleUnsubscribe(symbol, to, indicator, timeframe);
      });
    };
  }, [subscriptions]);

  return {
    handleSubscribe,
    handleUnsubscribe,
  };
};

export default useIndicatorSocket;
