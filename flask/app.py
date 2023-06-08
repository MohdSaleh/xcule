from flask import Flask, render_template, request, flash, redirect, jsonify
from flask_cors import CORS, cross_origin
import config, csv
from binance.client import Client
from binance.enums import *
import json
import requests
import pandas as pd

from main import main
from datetime import datetime
from tvDatafeed import TvDatafeed, Interval

# from tradingView import

tvusername = 'tugoftrades'
tvpassword = 'toc__123#'

tv = TvDatafeed(tvusername, tvpassword)

app = Flask(__name__)
# cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
import pytz
import datetime

tzinfo = pytz.timezone('Asia/kolkata')

client = Client('b65854306de8d7181d8256a23f81e4fd64bb69b42ec6e32bebd429bdd7ca47ea',
                '4f7d67b539ebc3df31906f8962474c611bfd2abf20aec2c61e3eff11de6d6ba0')


def convert_dataframe(df):
    df = df.reset_index() # Reset the index to get row numbers
    df = df[['datetime', 'open', 'high', 'low', 'close']] # Select the columns in the correct order
    df.columns = ['Time', 'Open', 'High', 'Low', 'Close'] # Rename the columns
    df['Time'] = df['Time'].apply(lambda x: datetime.datetime.timestamp(x)) # Convert the datetime to Unix timestamp
    return df



@app.route('/history')
@cross_origin()
def history():
    symbol = request.args.get('symbol')
    tf = request.args.get('tf')
    dp = int(request.args.get('depth'))
    # ex = request.args.get('ex')
    print(symbol, tf, dp)


    # candlesticks = client.get_historical_klines('BTCUSDT', '1h', limit=100)
    # print(candlesticks)
    dataTD = tv.get_hist(symbol=symbol, interval=Interval(tf), n_bars=3000)
    tdf = convert_dataframe(dataTD)
    # print(tdf.to_numpy())
    tdcandlesticks = tdf.to_numpy()


    mydict = dict()
    candleSetDict = dict()
    mydict["history"] = []
    candleSetDict['process'] = []


    # for data in candlesticks:
    #     candlestick = {"time": data[0] / 1000, "open": float(data[1]), "high": float(data[2]), "low": float(data[3]),
    #                    "close": float(data[4])}
    #     candleSet = {"Time": data[0] / 1000, "Open": float(data[1]), "High": float(data[2]), "Low": float(data[3]),
    #                    "Close": float(data[4])}
    #     mydict["history"].append(candlestick)
    #     candleSetDict['process'].append(candleSet)


    # tdfCandleHistory = []

    tdfCandleSet = []

    for data in tdcandlesticks:
        candlestick = {"time": data[0], "open": float(data[1]), "high": float(data[2]), "low": float(data[3]),
                       "close": float(data[4])}
        tdfCandleSet.append(candlestick)

    # df = pd.DataFrame(candleSetDict['process'])

    tdvdf = pd.DataFrame(tdf)

    # print(df)
    # print("------------------------------")
    # print(tdvdf)

    a = main(tdvdf, dp)

    ms  = []
    bosLL = []
    bosHH = []
    zoneD = []
    zoneS = []
    impHH = []
    impLL = []

    # for x in a[1]:
    #     mslines = {'time': int(tdvdf.iloc[[x[0]]]['Time']), 'value': float(x[1])}
    #     ms.append(mslines)

    for x in a[1]:
        mslines = {'time': int(tdvdf.iloc[[x[0]]]['Time']), 'price': float(x[1])}
        ms.append(mslines)

    for bos in a[6]:
        bosL = {'timeA': int(tdvdf.iloc[[bos[0]]]['Time']), 'price': float(bos[1]), 'timeB': int(tdvdf.iloc[[bos[2]]]['Time'])}
        bosLL.append(bosL)

    for bos in a[5]:
        bosH = {'timeA': float(tdvdf.iloc[[bos[0]]]['Time']), 'price': float(bos[1]), 'timeB': float(tdvdf.iloc[[bos[2]]]['Time'])}
        # print(bos)
        bosHH.append(bosH)

    for zone in a[3]:
        zones = {'timeA': float(tdvdf.iloc[[zone[0]]]['Time']), 'priceA': float(zone[1]), 'timeB': float(tdvdf.iloc[[zone[2]]]['Time']), 'priceB': float(zone[3])}
        # print(zones)
        zoneD.append(zones)
        
    for zone in a[4]:
        zones = {'timeA': float(tdvdf.iloc[[zone[0]]]['Time']), 'priceA': float(zone[1]), 'timeB': float(tdvdf.iloc[[zone[2]]]['Time']), 'price'
                                                                                                                                         'B': float(zone[3])}
        # print(zones)
        zoneS.append(zones)

    for imp in a[9]:
        imps = {'timeA': float(tdvdf.iloc[[imp[0]]]['Time']), 'valueA': float(imp[1]), 'timeB': float(tdvdf.iloc[[imp[2]]]['Time']), 'valueB': float(imp[3])}
        # print(imp)
        impHH.append(imps)

    for imp in a[10]:
        imps = {'timeA': float(tdvdf.iloc[[imp[0]]]['Time']), 'valueA': float(imp[1]), 'timeB': float(tdvdf.iloc[[imp[2]]]['Time']), 'valueB': float(imp[3])}
        # print(imp)
        impLL.append(imps)



    # print(ms)
    # return {"history": mydict["history"], "levels": json.dumps(ms), "bosLL" : bosLL, "bosHH" : bosHH, "zoneD" : zoneD, "zoneS": zoneS, "impLL": impLL, "impHH": impHH}
    return {"history": tdfCandleSet, "levels": ms, "bosLL": bosLL, "bosHH": bosHH, "zoneD": zoneD,"zoneS": zoneS, "impLL": impLL, "impHH": impHH}


@app.route('/')
def index():
    return 'Hello, world!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
