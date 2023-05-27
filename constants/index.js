const sendEventTypes = require('./socket-send-events');
const getEventTypes = require('./socket-get-events');
const nativeEventTypes = require('./socket-native-events');

module.exports = {
  nativeEventTypes,
  sendEventTypes,
  getEventTypes,
};
