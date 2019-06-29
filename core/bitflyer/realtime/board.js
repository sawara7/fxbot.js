const io = require('./base');
const util = require('../../utils')
const pt = require("percentile");

let board = {
    "middle":0,
    "bids":{},
    "asks":{}
}
exports.board = board;

const startBoard = async function (pair) {
    io.connectSocketIO(util.channelDict.board[pair], parseMessage);
};
exports.startBoard = startBoard;

const parseMessage = function(channelName, message){
    for (let side of ["asks","bids"]){
        let list = message[side];
        for (let l of list){
            if (l.price in board[side]){
                board[side][l.price].diff = l.size -  board[side][l.price]["size"];
            }else{
                board[side][l.price] = {};
                board[side][l.price]["diff"] = l.size;
            }
            board[side][l.price]["size"] = l.size;
            board[side][l.price]["lastTime"] = Date.now();
        };
    };
    board["middle"] = message.mid_price;
};

const getMax = function(price, range){
    let ret = {
        "asks" : {
            "size":0,
            "price":0
        },
        "bids" : {
            "size":0,
            "price":0
        }
    };
    for (let side of ["asks","bids"]){
        for (let key in board[side]){
            if (key > price + range || key < price - range){
                continue;
            };
            if (ret[side].size < board[side][key].size){
                ret[side].size = board[side][key].size;
                ret[side].price = key;
            }
        }
    }
    return ret;
}
exports.getMax = getMax;

const showAll = function(){
    for (let side of ["asks","bids"]){
        console.log(side);
        for (let key in board[side]){
            if (board[side][key].size > 10){
                console.log(key, board[side][key].size, board[side][key].diff);
            };
        }
    }
    return ret;
}
exports.showAll = showAll;

const getDiff = function(time, range){
    let ret = {};
    for (let side of ["asks","bids"]){
        ret[side] = {"diff":0,"size":0};
        for(let key in board[side]){
            if (Date.now() - board[side][key].lastTime < time){
                if (key < board.middle + range && key > board.middle - range){
                    ret[side].diff += board[side][key].diff;
                    ret[side].size += board[side][key].size;
                };
            };
        };
    };
    return ret;
};
exports.getDiff = getDiff;
