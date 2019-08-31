const io = require('./base');
const util = require('../../utils');

let ticker = {
    "sfdSellPrice":0,
    "sfdBuyPrice":0
}
exports.ticker = ticker;

const startTicker = async function (pair) {
    io.connectSocketIO(util.channelDict.ticker[pair], parseMessage);
};
exports.startTicker = startTicker;

const parseMessage = function(channelName, message){
    ticker[message.product_code] = message;
    if (message.product_code === "BTC_JPY"){
        ticker.sfdSellPrice = Math.ceil(message.best_bid * 1.050);
        ticker.sfdBuyPrice = Math.ceil(message.best_bid * 1.0499);
        if ("FX_BTC_JPY" in ticker){
            console.log(ticker.sfdSellPrice,ticker.FX_BTC_JPY.ltp, ticker.sfdSellPrice<ticker.FX_BTC_JPY.ltp);
        };
    };
};

const sfd = function(){
    let sfd = 0;
    if ("BTC_JPY" in ticker && "FX_BTC_JPY" in ticker){
        let ltp = ticker["BTC_JPY"].ltp;
        let fxltp = ticker["FX_BTC_JPY"].ltp;
        sfd = Math.abs((ltp - fxltp)/ltp * 100);
    }
    return sfd;
};
exports.sfd = sfd;


