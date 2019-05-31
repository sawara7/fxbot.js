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
}