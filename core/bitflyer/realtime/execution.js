const io = require('./base');
const util = require('../../utils')
const pt = require("percentile");

let executions = {
    "last":0,
    "all":{
        "price":[],
        "size":[],
        "time":[]        
    },
    "buy":{
        "price":[],
        "size":[],
        "time":[]
    },
    "sell":{
        "price":[],
        "size":[],
        "time":[]
    }
}

const startExecutions = async function (pair) {
    io.connectSocketIO(util.channelDict.execution[pair], parseMessage);
};
exports.startExecutions = startExecutions;

const parseMessage = function(channelName, message){
    for (i in message){
        executions.last = message[i];
        executions.all.price.push(message[i].price);
        executions.all.size.push(message[i].size);
        executions.all.time.push(new Date(message[i].exec_date).getTime());
        if (message[i].side === "BUY"){
            executions.buy.price.push(message[i].price);
            executions.buy.size.push(message[i].size);
            executions.buy.time.push(new Date(message[i].exec_date).getTime());
            continue;
        };
        if (message[i].side === "SELL"){
            executions.sell.price.push(message[i].price);
            executions.sell.size.push(message[i].size);
            executions.sell.time.push(new Date(message[i].exec_date).getTime());
            continue;
        };
    };
};

let trimmingProcID;
const startTrimData = function(seconds, interval){
    trimmingProcID = setInterval(
        () => {
            while (true){
                if (executions.buy.time[0] < Date.now() - seconds*1000) {
                    executions.buy.price.shift();
                    executions.buy.size.shift();
                    executions.buy.time.shift();
                }else{
                    break;
                };
            };
            while (true){
                if (executions.sell.time[0] < Date.now() - seconds*1000) {
                    executions.sell.price.shift();
                    executions.sell.size.shift();
                    executions.sell.time.shift();
                }else{
                    break;
                };
            };
            while (true){
                if (executions.all.time[0] < Date.now() - seconds*1000) {
                    executions.all.price.shift();
                    executions.all.size.shift();
                    executions.all.time.shift();
                }else{
                    break;
                };
            };
        },
        interval
    )
};
exports.startTrimData = startTrimData;

const getPercentile = function(percentile, seconds){
    let plist = [];
    for (let i in executions.buy.price){
        if (executions.buy.time[i] > Date.now() - seconds*1000){
            plist.push(executions.buy.price[i]);
        };
    };
    return pt(percentile, plist);
}
exports.getPercentile = getPercentile;

const getSize = function(seconds){
    let sum = {
        "buy": 0,
        "sell":0
    }
    for(let i in executions.buy.size){
        if (executions.buy.time[i] > Date.now() - seconds*1000){
            sum.buy += executions.buy.size[i];
        };
    };
    for(let i in executions.sell.size){
        if (executions.sell.time[i] > Date.now() - seconds*1000){
            sum.sell += executions.sell.size[i];
        };
    };
    return sum;
}
exports.getSize = getSize;

const calcCandle = function(seconds, list){
    let l = [];
    for(let i in list.time){
        if (list.time[i] > Date.now() - seconds*1000){
            l.push(list.price[i]);
        };
    };
    return {
        "open":l[0],
        "close":l[l.length-1],
        "max":Math.max(...l),
        "min":Math.min(...l)
    };
};

const getCandle = function(seconds){
    return calcCandle(seconds, executions.all);
}
exports.getCandle = getCandle;

const getCandleBuySide = function(seconds){
    return calcCandle(seconds, executions.buy);
}
exports.getCandleBuySide = getCandleBuySide;

const getCandleSellSide = function(seconds){
    return calcCandle(seconds, executions.sell);
}
exports.getCandleSellSide = getCandleSellSide;

const stopTrimData = function(){
    clearInterval(trimmingProcID);
};
exports.stopTrimData = stopTrimData;

// const ShowInfo = function(){
//     setInterval(
//         () => {
//             // console.log("length:", executions.buy.time.length);
//             // console.log("percentile:", executions.last.price - getPercentile(50, 30) );
//             console.log("p_range:", getPercentile(0, 1) - getPercentile(100, 1));
//             console.log("s_range:", getSize(1));
//         },1000);
// };