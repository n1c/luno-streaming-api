// https://www.luno.com/en/developers/api#tag/Streaming-API-(beta)
const KEY = 'Hello';
const SECRET = 'World';

var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('Connected');

    connection.send(JSON.stringify({
        'api_key_id': KEY,
        'api_key_secret': SECRET,
    }));

    connection.on('error', function (error) {
        console.log("Connection Error", error.toString(), error);
    });

    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });

    connection.on('message', function (message) {
        try {
            const payload = JSON.parse(message.utf8Data);
            console.log(`Payload sequence: ${payload.sequence}`);
        } catch (err) {
            console.log('JSON parse fail', err);
        }
    });
});

client.connect('wss://ws.luno.com/api/1/stream/ETHXBT', 'echo-protocol');
