// https://www.luno.com/en/developers/api#tag/Streaming-API-(beta)
const KEY = 'Hello';
const SECRET = 'World';

const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();

let orders = [];

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
        console.log('Connection Error', error.toString(), error);
    });

    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });

    connection.on('message', function (message) {
        let payload = {};
        try {
            payload = JSON.parse(message.utf8Data);
        } catch (err) {
            console.log('JSON parse fail', err);
            return;
        }

        if (!payload.sequence || !payload.timestamp) {
          return;
        }

        if (Array.isArray(payload.bids)) {
            pushOrders(payload.bids);
        }

        if (Array.isArray(payload.asks)) {
            pushOrders(payload.asks);
        }

        if (payload.delete_update && payload.delete_update.order_id) {
            deleteOrder(payload.delete_update.order_id);
        }

        if (payload.create_update) {
            pushOrder({
                id: payload.create_update.order_id,
                price: payload.create_update.price,
                volume: payload.create_update.volume,
            });
        }

        if (payload.trade_updates) {
            payload.trade_updates.forEach(e => {
                const order = findOrder(e.order_id);
                const makerOrder = findOrder(e.maker_order_id);
                const takerOrder = findOrder(e.taker_order_id);

                console.log('trade_update', makerOrder, takerOrder, order);

                deleteOrder(e.maker_order_id);
                deleteOrder(e.taker_order_id);
            });
        }
    });
});

function pushOrders (orders) {
    orders.forEach(o => pushOrder(o));
}

function pushOrder (o) {
    orders.push(o);
}

function findOrder (id) {
    return orders.find(e => e.id == id);
}

function deleteOrder (id) {
    const index = orders.findIndex(e => e.id === id);

    if (!index) {
      console.error(`Failed to Delete order ${id} we didn't have`);
      return null;
    }

    return orders.splice(index, 1)[0];
}

client.connect('wss://ws.luno.com/api/1/stream/XBTZAR', 'echo-protocol');
