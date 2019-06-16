'use strict';
const fxutil = require('../core/utils');
const bf = require('../core/bitflyer/api');
const ex = require('../core/bitflyer/realtime/execution');

let ind  = 'none';
let ind2 = 'none';
let previous_ind = 'none';


let calcIndicator = function() {
    ex.startExecutions('fxbtcjpy');
    ex.startTrimData(600,400);
    let size_list = {
        "buy" : [],
        "sell": []
    };
    let volume_speed = {
        "buy" :[],
        "sell":[]
    };

    setInterval(
        () => {
        for (let side of ["buy","sell"]){
            if (size_list[side].length > 10){
                size_list[side].shift();
            };
            let pre_size = -1;
            let diff = 0;
            for (let size of size_list[side]){
                if (pre_size === -1){
                    pre_size = size;
                    continue;
                };
                diff += size - pre_size;
            };
            volume_speed[side].push(diff/size_list[side].length);
        };
        console.log(volume_speed["buy"][volume_speed["buy"].length-1], volume_speed["sell"][volume_speed["sell"].length-1]);
    },500);

    setInterval(
        () => {
        let candleLong = ex.getCandle(420,0);
        let candleShort = ex.getCandle(60,0);
        let indicator = {
            "buy":0,
            "sell":0
        };
        for (let side of ["buy","sell"]){
            if (volume_speed[side].length > 1){
                volume_speed[side].shift();
            };
            for (let size of volume_speed[side]){
                indicator[side] += size;
            };
        };
        console.log(indicator["buy"], indicator["sell"]);
        ind = "none";
        if (indicator["buy"] < indicator["sell"] && indicator["buy"] < -5000 && candleLong.min === candleShort.min){
            ind = "up";
        };
        if (indicator["sell"] < indicator["buy"] && indicator["sell"] < -5000 && candleLong.max === candleShort.max){
            ind = "down";
        };

        ind2 = "none";
        if (indicator["buy"] < indicator["sell"] && indicator["buy"] < -5000){
            ind2 = "up";
        };
        if (indicator["sell"] < indicator["buy"] && indicator["sell"] < -5000){
            ind2 = "down";
        };
    },500);

    setInterval(
        () => {
        let ret = ex.CalcVolumeSpeed(50); //BTC
        size_list["buy"].push(ret.buy);
        size_list["sell"].push(ret.sell);
    },500);
};

let losscut = async function(result){
    if ((result.side === "buy" && ind2 === "up") || (result.side === "sell" && ind2 === "down")){
        return true;
    };
};

let doTrade = async function() {
    while(true){
        try{
            if (bf.sfd() > 4.85){
                continue;
            };
        }catch(error){
            console.log(error);
            await fxutil.sleep(10000);
            continue;
        }
        try {
            if( ind === 'down'){
                let od = await bf.createMarketLimitOrder(500, 0.03, 'sell');
                await bf.checkOrderStatus(od.id, 'FX_BTC_JPY', 'closed', 60*1000, 1000, losscut);
                continue;
            };
            if( ind === 'up'){
                let od = await bf.createMarketLimitOrder(500, 0.03, 'buy');
                await bf.checkOrderStatus(od.id, 'FX_BTC_JPY', 'closed', 60*1000, 1000, losscut);
                continue;
            };
        } catch(error) {
            console.log(error);
            await bf.cancelAllOrder();
            await bf.closeAllPosition();
            await fxutil.sleep(2000);
            continue;
        };
        await fxutil.sleep(500);
    };
};

exports.doTrade = async () => {
    bf.startTicker(10000);
    bf.startSFD(10000);
    calcIndicator();
    // await fxutil.sleep(1000 * 60 * 5);
    doTrade();
};
