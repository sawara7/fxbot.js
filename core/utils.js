const ss = require('simple-statistics');

exports.sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

exports.getCorrel = function(list, value, length) {
    let timelist = []
    list.push(Number(value));
    if (list.length > length){
        list.shift();
    }
    for (let i in list){
        timelist.push(Number(i));
    }
    return ss.sampleCorrelation(timelist, list);
}

exports.getCorrel = function(list) {
    let timelist = []
    for (let i in list){
        timelist.push(Number(i));
    }
    return ss.sampleCorrelation(timelist, list);
}

exports.getSlope = function(list, value, length) {
    let timelist = []
    let data = []
    list.push(Number(value));
    if (list.length > length){
        list.shift();
    }
    for (let i in list){
        timelist.push(Number(i));
    }
    for (let j in list){
        data.push([timelist[j], Number(list[j] - list[0])]);
    }
    let reg = ss.linearRegression(data);
    return reg.m;
}

exports.getSlope = function(list) {
    let timelist = []
    let data = []
    for (let i in list){
        timelist.push(Number(i));
    }
    for (let j in list){
        data.push([timelist[j], Number(list[j] - list[0])]);
    }
    let reg = ss.linearRegression(data);
    return reg.m;
}

exports.getSlopeAndCorrel = function(list, value, length) {
    let timelist = []
    let data = []
    list.push(Number(value));
    if (list.length > length){
        list.shift();
    }
    for (let i in list){
        timelist.push(Number(i));
    }
    for (let j in list){
        data.push([timelist[j], Number(list[j] - list[0])]);
    }
    let s = ss.linearRegression(data).m;
    let c = ss.sampleCorrelation(timelist, list);
    return {'s':s, 'c':c};
};

const channelDict = {
    "ticker":{
        "btcjpy":"lightning_ticker_BTC_JPY",
        "fxbtcjpy":"lightning_ticker_FX_BTC_JPY",
    },
    "execution":{
        "btcjpy":"lightning_executions_BTC_JPY",
        "fxbtcjpy":"lightning_executions_FX_BTC_JPY",
    },
    "board":{
        "btcjpy":"lightning_board_BTC_JPY",
        "fxbtcjpy":"lightning_board_FX_BTC_JPY",
    }
};
exports.channelDict = channelDict;