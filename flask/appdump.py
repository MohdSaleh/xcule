from flask import Flask, render_template, request, flash, redirect, jsonify
from flask_cors import CORS, cross_origin
import config, csv
from binance.client import Client
from binance.enums import *
import json
import requests
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import argrelextrema
import math
from main import main
from datetime import datetime
from tvDatafeed import TvDatafeed, Interval

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
    df = df.reset_index()  # Reset the index to get row numbers
    df = df[['datetime', 'open', 'high', 'low', 'close']]  # Select the columns in the correct order
    df.columns = ['Time', 'Open', 'High', 'Low', 'Close']  # Rename the columns
    df['Time'] = df['Time'].apply(lambda x: datetime.datetime.timestamp(x))  # Convert the datetime to Unix timestamp
    return df


@app.route('/history')
@cross_origin()
def history():
    symbol = request.args.get('symbol')
    tf = request.args.get('tf')
    dp = int(request.args.get('depth'))

    print(symbol, tf, dp)

    candlesticks = client.get_historical_klines(symbol, tf, limit=100)
    # print(candlesticks)
    dataTD = tv.get_hist(symbol='BTCUSDT', exchange='BINANCE', interval=Interval.in_5_minute, n_bars=1000)
    tdf = convert_dataframe(dataTD)
    # print(tdf.to_numpy())
    tdcandlesticks = tdf.to_numpy()

    mydict = dict()
    candleSetDict = dict()
    mydict["history"] = []
    candleSetDict['process'] = []

    for data in candlesticks:
        candlestick = {"time": data[0] / 1000, "open": float(data[1]), "high": float(data[2]), "low": float(data[3]),
                       "close": float(data[4])}
        candleSet = {"Time": data[0] / 1000, "Open": float(data[1]), "High": float(data[2]), "Low": float(data[3]),
                     "Close": float(data[4])}
        mydict["history"].append(candlestick)
        candleSetDict['process'].append(candleSet)

    tdfCandleHistory = []
    tdfCandleSet = []

    for data in tdcandlesticks:
        candlestick = {"time": data[0], "open": float(data[1]), "high": float(data[2]), "low": float(data[3]),
                       "close": float(data[4])}
        tdfCandleSet.append(candlestick)

    df = pd.DataFrame(candleSetDict['process'])
    tdvdf = pd.DataFrame(tdf)

    print(df)
    print("------------------------------")
    print(tdvdf)

    # print(mydict["history"], "____________________________________________________/n")
    # print(tdfCandleSet)

    # print(df.dtypes)
    # print(tdf.dtypes)

    # gptMS = find_market_structure(df)
    # df.to_csv("bn-candle-data.csv")
    # tdf.drop(tdf.tail(1000).index,inplace = True)
    # tdf.to_csv("td-candle-data.csv")
    # mixedDf = pd.concat([tdf, df], axis=0)
    # mixedDf.to_csv("tdbn-candle-data.csv")
    # print("TD DATA SET *__________________________________", tdf, "*__________________________________TD DATA SET")
    # print("BN DATA SET *__________________________________", df, "*__________________________________BN DATA SET")

    # a = main(df, dp)
    a = main(tdvdf, dp)

    ms = []
    bosLL = []
    bosHH = []
    zoneD = []
    zoneS = []
    impHH = []
    impLL = []

    for x in a[1]:
        mslines = {'time': float(df.iloc[[x[0]]]['Time']), 'value': float(x[1])}
        ms.append(mslines)

    for bos in a[6]:
        bosL = {'timeA': float(df.iloc[[bos[0]]]['Time']), 'value': float(bos[1]),
                'timeB': float(df.iloc[[bos[2]]]['Time'])}
        bosLL.append(bosL)

    for bos in a[5]:
        bosH = {'timeA': float(df.iloc[[bos[0]]]['Time']), 'value': float(bos[1]),
                'timeB': float(df.iloc[[bos[2]]]['Time'])}
        # print(bos)
        bosHH.append(bosH)

    for zone in a[3]:
        zones = {'timeA': float(df.iloc[[zone[0]]]['Time']), 'valueA': float(zone[1]),
                 'timeB': float(df.iloc[[zone[2]]]['Time']), 'valueB': float(zone[3])}
        # print(zones)
        zoneD.append(zones)

    for zone in a[4]:
        zones = {'timeA': float(df.iloc[[zone[0]]]['Time']), 'valueA': float(zone[1]),
                 'timeB': float(df.iloc[[zone[2]]]['Time']), 'valueB': float(zone[3])}
        # print(zones)
        zoneS.append(zones)

    for imp in a[9]:
        imps = {'timeA': float(df.iloc[[imp[0]]]['Time']), 'valueA': float(imp[1]),
                'timeB': float(df.iloc[[imp[2]]]['Time']), 'valueB': float(imp[3])}
        # print(imp)
        impHH.append(imps)

    for imp in a[10]:
        imps = {'timeA': float(df.iloc[[imp[0]]]['Time']), 'valueA': float(imp[1]),
                'timeB': float(df.iloc[[imp[2]]]['Time']), 'valueB': float(imp[3])}
        # print(imp)
        impLL.append(imps)

    # return {"history": mydict["history"], "levels": json.dumps(ms), "bosLL" : bosLL, "bosHH" : bosHH, "zoneD" : zoneD, "zoneS": zoneS, "impLL": impLL, "impHH": impHH}
    return {"history": tdfCandleSet, "levels": json.dumps(ms), "bosLL": bosLL, "bosHH": bosHH, "zoneD": zoneD,
            "zoneS": zoneS, "impLL": impLL, "impHH": impHH}


# def find_market_structure(candles):
#     """Find the Total Market Structure of a given set of candles.
#
#     Args:
#         candles (pandas.DataFrame): A pandas DataFrame containing candle data,
#             with columns "Index", "Time", "Open", "High", "Low", and "Close".
#
#     Returns:
#         dict: A dictionary containing the set of time, value, and index of each
#             point of the Total Market Structure, with keys "HH", "HL", "LL",
#             and "LH".
#     """
#     # Initialize the dictionary of points
#     points = {
#         "HH": set(),
#         "HL": set(),
#         "LL": set(),
#         "LH": set(),
#     }
#
#     # Find the first LL point
#     first_point = candles.iloc[:5]["Low"].min()
#     first_point_index = candles.iloc[:5]["Low"].idxmin()
#     first_point_time = candles.loc[first_point_index, "Time"]
#     points["LL"].add((first_point_time, first_point, first_point_index))
#
#     # Find the rest of the points
#     for i in range(5, len(candles) - 5):
#         # Look at the previous and next 5 candles
#         prev_candles = candles.iloc[i - 5:i]
#         next_candles = candles.iloc[i + 1:i + 6]
#
#         # Find the highest high and lowest low of the previous candles
#         prev_high = prev_candles["High"].max()
#         prev_low = prev_candles["Low"].min()
#
#         # Find the highest high and lowest low of the next candles
#         next_high = next_candles["High"].max()
#         next_low = next_candles["Low"].min()
#
#         # Check if we have a new HH, HL, LL, or LH point
#         if next_high > prev_high:
#             points["HH"].add((candles.loc[i + 1, "Time"], next_high, i + 1))
#         elif next_low > prev_low:
#             points["HL"].add((candles.loc[i + 1, "Time"], next_low, i + 1))
#         elif next_low < prev_low:
#             points["LL"].add((candles.loc[i + 1, "Time"], next_low, i + 1))
#         elif next_high < prev_high:
#             points["LH"].add((candles.loc[i + 1, "Time"], next_high, i + 1))
#
#     return points


# main driver function
if __name__ == '__main__':
    # run() method of Flask class runs the application
    # on the local development server.
    app.run(host='0.0.0.0', port=8000)
