const io = require('socket.io-client');

const socket = io("https://io.lightstream.bitflyer.com", { transports: ["websocket"] });

exports.connectSocketIO = async (channelName, proc) => {
    socket.on("connect", () => {
        socket.emit("subscribe", channelName);
    });
    socket.on(channelName, message => {
        proc(channelName, message);
    });
};

exports.disconnectSocketIO = async(channelName) => {
    socket.removeListener(channelName);
};
