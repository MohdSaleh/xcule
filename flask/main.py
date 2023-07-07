import numpy as np
from datetime import date
today = date.today()
lev = []
testarray = []
lastIndex = 0
runs = 'H'
tradingRangeH = []
tradingRangeL = []
demandzonevalues = []
supplyzonevalues = []
bosLL = []
bosHH = []
impLL = []
impHH = []
def runforlows(candleSet, runningIndex, depth):
    bosfill = 0
    cl = 0
    finalLow = candleSet['Low'][runningIndex]
    flI = 0
    depth = depth
    runningIndex = runningIndex
    for i in range(runningIndex, len(candleSet) - 1):
        if len(lev) >= 2 and lev[-2][1] > candleSet['Low'][i] and bosfill != 1:
            breakofstructureLL(candleSet, candleSet.iloc[i], i)
            bosfill = 1
        if finalLow > candleSet['Low'][i] or finalLow == candleSet['Low'][i]:
            finalLow = candleSet['Low'][i]
            flI = i
            cl = 0
        else:
            cl = cl + 1
        if cl == depth:
            if flI != lev[len(lev) - 1][0]:
                lev.append((flI, finalLow))
                testarray.append((flI, finalLow, "LOW"))
                return flI + 1
            else:
                # print("More lower candles found")
                cl = cl - 1
def runforhigs(candleSet, runningIndex, depth):
    bosfill = 0
    ch = 0
    finalHigh = 0
    flH = 0
    depth = depth
    runningIndex = runningIndex
    for i in range(runningIndex, len(candleSet)):
        if len(lev) >= 2 and lev[-2][1] < candleSet['High'][i] and bosfill != 1:
            breakofstructureHH(candleSet, candleSet.iloc[i], i)
            bosfill = 1
        if finalHigh < candleSet['High'][i] or finalHigh == candleSet['High'][i]:
            finalHigh = candleSet['High'][i]
            flH = i
            ch = 0
        else:
            ch = ch + 1
        if ch == depth:
            if flH != lev[len(lev) - 1][0]:
                lev.append((flH, finalHigh))
                testarray.append((flH, finalHigh, "HIGH"))
                return flH + 1
            else:
                ch = ch - 1
                
def checkcandles(candle):
    # print("Got candle, Checking")
    if candle['Open'] < candle['Close']:
        return "Green"

    elif candle['Open'] > candle['Close']:
        return "Red"
    
def breakofstructureHH(candleSet, candle, i):
    getdemandzones(candleSet, lev[-1][0], i)
    getimpulsivemovement(candleSet, lev[-2][0], lev[-1][0], 'Buy', i)
    bosHH.append((lev[-2][0], lev[-2][1], i, lev[-2][1]))

def breakofstructureLL(candleSet, candle, i):
    getsupplyzones(candleSet, lev[-1][0], i)
    getimpulsivemovement(candleSet, lev[-2][0], lev[-1][0], 'Sell', i)
    bosLL.append((lev[-2][0], lev[-2][1], i, lev[-2][1]))

def getimpulsivemovement(candleSet, bcslowIndex, bcshighIndex, str, bosIndex):
    if str == 'Buy':
        for i in range(bcshighIndex, bosIndex):
            if candleSet['High'][i] < candleSet['Low'][i + 2]:
                impHH.append((i, candleSet['High'][i], i + 2, candleSet['Low'][i + 2]))
    else:
        for i in range(bcshighIndex, bosIndex):
            if candleSet['Low'][i] > candleSet['High'][i + 2]:
                impLL.append((i, candleSet['Low'][i], i + 2, candleSet['High'][i + 2]))

def getdemandzones(candleSet, bcslowIndex, j):
    # print("DZ", bcslowIndex)
    brcheck = 0
    if checkcandles(candleSet.iloc[bcslowIndex]) == "Red":
        # print("Demand Confirmed at", checkcandles(candleSet.iloc[bcslowIndex]))
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['High'][bcslowIndex] > candleSet['Low'][i] and brcheck != 1:  # Not valid demand zone
                # print("Demand Failed at index", i)
                demandzonevalues.append(
                    (bcslowIndex, candleSet['High'][bcslowIndex], i - 1, candleSet['Low'][bcslowIndex]))
                brcheck = 1
                break
        if brcheck == 0:
            demandzonevalues.append(
                (bcslowIndex, candleSet['High'][bcslowIndex], len(candleSet) - 1, candleSet['Low'][bcslowIndex]))
    elif checkcandles(candleSet.iloc[bcslowIndex - 1]) == "Red" and brcheck != 1:  # Considering the previous candle
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['High'][bcslowIndex - 1] > candleSet['Low'][i]:  # Not valid demand zone
                # print("Demand Failed at index", i)
                demandzonevalues.append(
                    (bcslowIndex - 1, candleSet['High'][bcslowIndex - 1], i - 1, candleSet['Low'][bcslowIndex]))
                brcheck = 1
                break
        if brcheck == 0:
            demandzonevalues.append((bcslowIndex - 1, candleSet['High'][bcslowIndex - 1], len(candleSet) - 1,
                                     candleSet['Low'][bcslowIndex]))
    else:
        # print("Demand Confirmed at", checkcandles(candleSet.iloc[bcslowIndex]))
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['High'][bcslowIndex] > candleSet['Low'][i] and brcheck != 1:  # Not valid demand zone
                # print("Demand Failed at index", i)
                demandzonevalues.append(
                    (bcslowIndex, candleSet['High'][bcslowIndex], i - 1, candleSet['Low'][bcslowIndex]))
                brcheck = 1
                break
        if brcheck == 0:
            demandzonevalues.append(
                (bcslowIndex, candleSet['High'][bcslowIndex], len(candleSet) - 1, candleSet['Low'][bcslowIndex]))

def getsupplyzones(candleSet, bcshighIndex, j):
    brcheck = 0
    if checkcandles(candleSet.iloc[bcshighIndex]) == "Green":
        # print("Supply Confirmed at", checkcandles(candleSet.iloc[bcshighIndex]))
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['Low'][bcshighIndex] < candleSet['High'][i] and brcheck != 1:  # Not valid supply zone Retest POINT
                # print("Supply Failed at index", i)
                supplyzonevalues.append(
                    (bcshighIndex, candleSet['Low'][bcshighIndex], i - 1, candleSet['High'][bcshighIndex]))
                brcheck = 1
                break
        if brcheck == 0:  # Valid supply zone
            supplyzonevalues.append(
                (bcshighIndex, candleSet['Low'][bcshighIndex], len(candleSet) - 1, candleSet['High'][bcshighIndex]))

    elif checkcandles(candleSet.iloc[bcshighIndex - 1]) == "Green":  # Considering the previous candle
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['Low'][bcshighIndex - 1] < candleSet['High'][i] and brcheck != 1:  # Not valid supply zone
                # print("Supply Failed at index", i)
                supplyzonevalues.append(
                    (bcshighIndex - 1, candleSet['Low'][bcshighIndex - 1], i - 1, candleSet['High'][bcshighIndex]))
                brcheck = 1
                break
        if brcheck == 0:  # Valid supply zone
            supplyzonevalues.append((bcshighIndex - 1, candleSet['Low'][bcshighIndex - 1], len(candleSet) - 1,
                                     candleSet['High'][bcshighIndex]))
    else:
        for i in range(j + 1, len(candleSet) - 1):
            if candleSet['Low'][bcshighIndex] < candleSet['High'][i] and brcheck != 1:  # Not valid supply zone Retest POINT
                # print("Supply Failed at index", i)
                supplyzonevalues.append(
                    (bcshighIndex, candleSet['Low'][bcshighIndex], i - 1, candleSet['High'][bcshighIndex]))
                brcheck = 1
                break
        if brcheck == 0:  # Valid supply zone
            supplyzonevalues.append(
                (bcshighIndex, candleSet['Low'][bcshighIndex], len(candleSet) - 1, candleSet['High'][bcshighIndex]))

def gettradingrange(candleSet, bcshighIndex, bcslowIndex, str):
    if str == 'Sell':
        if len(tradingRangeH) != 0 and len(tradingRangeL) != 0:
            del tradingRangeH[-1]
            del tradingRangeL[-1]
            tradingRangeH.append((bcshighIndex, candleSet['High'][bcshighIndex]))
            tradingRangeL.append((bcslowIndex, candleSet['Low'][bcslowIndex]))
        else:
            tradingRangeH.append((bcshighIndex, candleSet['High'][bcshighIndex]))
            tradingRangeL.append((bcslowIndex, candleSet['Low'][bcslowIndex]))
    else:
        if len(tradingRangeH) != 0 and len(tradingRangeL) != 0:
            del tradingRangeH[-1]
            del tradingRangeL[-1]
            tradingRangeH.append((bcshighIndex, candleSet['Low'][bcshighIndex]))
            tradingRangeL.append((bcslowIndex, candleSet['High'][bcslowIndex]))
        else:
            tradingRangeH.append((bcshighIndex, candleSet['Low'][bcshighIndex]))
            tradingRangeL.append((bcslowIndex, candleSet['High'][bcslowIndex]))

def getmarketstructure(candleSet, depth):
    lastIndex = 0
    runs = 'H'
    if len(candleSet) > depth:
        print(len(candleSet), 'candles length')
        last5LowCandles = (np.array(candleSet['Low']))[:depth]
        print(last5LowCandles, "last5LowCandles")
        last5Low = np.min(last5LowCandles)
        last5LowIndex = np.where(last5LowCandles == last5Low)[0][0]
        lev.append((last5LowIndex, last5Low))
        testarray.append((last5LowIndex, last5Low, "LOW"))
        lastIndex = last5LowIndex
        i = 0
        while i < len(candleSet) - 1:
            if runs == "H":
                lastIndex = runforhigs(candleSet,lastIndex, depth)
                runs = "L"
            else:
                lastIndex = runforlows(candleSet,lastIndex, depth)
                runs = "H"
            # print("MAIN FN SHIFT TO CHANGED TO =", runs)
            # print(testarray)
            if lastIndex is not None:
                i = lastIndex
            else:
                # print("Failed to Find HIGHS OR LOWS", runs)
                # runs = 'L'  # Shifting the run
                if runs == "H":
                    last5HighCandles = (np.array(candleSet['High']))[-depth:]
                    last5High = np.max(last5HighCandles)
                    last5HighIndex = np.where(last5HighCandles == last5High)[0][0]
                    if last5High != lev[-1][1]:
                        lev.append((len(candleSet) - depth + last5HighIndex, last5High))
                        testarray.append((len(candleSet) - depth + last5HighIndex, last5High, "HIGH"))
                    runs = "L"
                else:
                    # print("Failed to Find HIGHS OR LOWS", runs)
                    last5LowCandles = (np.array(candleSet['Low']))[-depth:]
                    last5Low = np.min(last5LowCandles)
                    last5LowIndex = np.where(last5LowCandles == last5Low)[0][0]
                    if last5Low != lev[-1][1]:
                        lev.append((len(candleSet) - depth + last5LowIndex, last5Low))
                        testarray.append((len(candleSet) - depth + last5LowIndex, last5Low, "LOW"))
                    runs = "H"
                break

def main(candleSet, depth):
    print("Getting SMC data.............!")
    getmarketstructure(candleSet, depth)

    global lev, testarray, demandzonevalues, supplyzonevalues, bosHH, bosLL, tradingRangeH, tradingRangeL, impHH, impLL
    rcandleSet = candleSet
    rlev = lev
    rtestarray = testarray
    rdemandzonevalues = demandzonevalues
    rsupplyzonevalues = supplyzonevalues
    rbosHH = bosHH
    rbosLL = bosLL
    rtradingRangeH = tradingRangeH
    rtradingRangeL = tradingRangeL
    rimpHH = impHH
    rimpLL = impLL
    lev = []
    testarray = []
    demandzonevalues = []
    supplyzonevalues = []
    bosHH = []
    bosLL = []
    tradingRangeH = []
    tradingRangeL = []
    impHH = []
    impLL = []
    return rcandleSet, rlev, rtestarray, rdemandzonevalues, rsupplyzonevalues, rbosHH, rbosLL, rtradingRangeH, rtradingRangeL, rimpHH, rimpLL