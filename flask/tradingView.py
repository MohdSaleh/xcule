import json
import random
import re
import string

import requests
from websocket import create_connection


def search(query, type):
    # type = 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic'
    # query = what you want to search!
    # it returns first matching item
    res = requests.get(
        f"https://symbol-search.tradingview.com/symbol_search/?text={query}&type={type}"
    )
    if res.status_code == 200:
        res = res.json()
        assert len(res) != 0, "Nothing Found."
        return res[0]
    else:
        print("Network Error!")
        exit(1)


def generateSession():
    stringLength = 12
    letters = string.ascii_lowercase
    random_string = "".join(random.choice(letters) for i in range(stringLength))
    return "qs_" + random_string


def prependHeader(st):
    return "~m~" + str(len(st)) + "~m~" + st


def constructMessage(func, paramList):
    return json.dumps({"m": func, "p": paramList}, separators=(",", ":"))


def createMessage(func, paramList):
    return prependHeader(constructMessage(func, paramList))


def sendMessage(ws, func, args):
    ws.send(createMessage(func, args))


def sendPingPacket(ws, result):
    pingStr = re.findall(".......(.*)", result)
    if len(pingStr) != 0:
        pingStr = pingStr[0]
        ws.send("~m~" + str(len(pingStr)) + "~m~" + pingStr)


def socketJob(ws):
    while True:
        try:
            result = ws.recv()
            print("========>>>",result)
            if "quote_completed" in result or "session_id" in result:
                continue
            Res = re.findall("^.*?({.*)$", result)
            print(">>>", Res)
            if len(Res) != 0:
                jsonRes = json.loads(Res[0])

                if jsonRes["m"] == "qsd":
                    symbol = jsonRes["p"][1]["n"]
                    price = jsonRes["p"][1]["v"]["lp"]
                    print(f"{symbol} -> {price}")
            else:
                # ping packet
                sendPingPacket(ws, result)
        except KeyboardInterrupt:
            print("\nGoodbye!")
            exit(0)
        except Exception as e:
            print(f"ERROR: {e}\nTradingView message: {result}")
            continue


def getSymbolId(pair, market):
    data = search(pair, market)
    symbol_name = data["symbol"]
    try:
        broker = data["prefix"]
    except KeyError:
        broker = data["exchange"]
    symbol_id = f"{broker.upper()}:{symbol_name.upper()}"
    print(symbol_id, end="\n\n")
    return symbol_id


def main(pair, market):

    # serach btcusdt from crypto category
    symbol_id = getSymbolId(pair, market)

    # create tunnel
    tradingViewSocket = "wss://data.tradingview.com/socket.io/websocket"
    headers = json.dumps({"Origin": "https://data.tradingview.com"})
    ws = create_connection(tradingViewSocket, headers=headers)
    session = generateSession()

    # Send messages
    # sendMessage(ws, "chart_create_session", [session, ""])
    sendMessage(ws, "quote_create_session", [session])
    sendMessage(ws, "quote_set_fields", [session,"ch","chp","current_session","description","local_description","language","exchange","fractional",
                "is_tradable",
                "lp",
                "lp_time",
                "minmov",
                "minmove2",
                "original_name",
                "pricescale",
                "pro_name",
                "short_name",
                "type",
                "update_mode",
                "volume",
                "currency_code",
                "rchp",
                "rtc",])
    sendMessage(ws, "quote_add_symbols", [session, symbol_id])
    sendMessage(ws, "quote_fast_symbols", [session, symbol_id])
    # sendMessage(ws, "resolve_symbol", [session, symbol_id])


    # Start job
    socketJob(ws)


if __name__ == "__main__":
    pair = "gbpusd"
    market = "forex"
    main(pair, market)
