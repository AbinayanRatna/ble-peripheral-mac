var util = require('util');
var bleno = require('bleno-mac'); 
var BlenoCharacteristic = bleno.Characteristic;

var CustomCharacteristic = function() {
    CustomCharacteristic.super_.call(this, {
        uuid: 'fd758b93-0bfa-4c52-8af0-85845a74a606',
        properties: ['read', 'write', 'notify']
    });

    this._value = Buffer.alloc(0);
    this._updateValueCallback = null;
    this._chunkTimeout = null; // Timeout handle for detecting end of transmission
    this.accumulatedData = Buffer.alloc(0); // Store all received chunks
};

util.inherits(CustomCharacteristic, BlenoCharacteristic);

CustomCharacteristic.prototype.onReadRequest = function(offset, callback) {
    console.log('CustomCharacteristic onReadRequest');
    var data = Buffer.alloc(1);
    data.writeUInt8(42, 0);
    callback(this.RESULT_SUCCESS, data);
};

CustomCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    console.log('CustomCharacteristic - onWriteRequest: chunk =', data.toString());

    // Append new chunk to accumulated data
    this.accumulatedData = Buffer.concat([this.accumulatedData, data]);

    // Reset/start a 1-second timeout to detect end of transmission
    if (this._chunkTimeout) {
        clearTimeout(this._chunkTimeout);
    }
    this._chunkTimeout = setTimeout(() => {
        this._handleCompleteMessage();
    }, 1000); // 1-second delay

    callback(this.RESULT_SUCCESS);
};

CustomCharacteristic.prototype._handleCompleteMessage = function() {
    const fullMessage = this.accumulatedData.toString();
    console.log("✅ Full message received:", fullMessage);

    // Extract last 5 characters
    const last5Chars = fullMessage.slice(-5);
    console.log("Last 5 chars:", last5Chars);

    // Send notification (if client is subscribed)
    if (this._updateValueCallback) {
        const response = Buffer.from("received-"+last5Chars);
        this._updateValueCallback(response);
        console.log("Sent last 5 chars as notification:", last5Chars);
    }

    // Reset accumulated data for next transmission
    this.accumulatedData = Buffer.alloc(0);
};

CustomCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('CustomCharacteristic - onSubscribe');
    this._updateValueCallback = updateValueCallback;
};

CustomCharacteristic.prototype.onUnsubscribe = function() {
    console.log('CustomCharacteristic - onUnsubscribe');
    this._updateValueCallback = null;
};

module.exports = CustomCharacteristic;
