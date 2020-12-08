const EventEmitter = require('events');
const ModbusRTU = require("modbus-serial");

'use strict;'

function _round(num, digits = 2){
	const pow = 10 ** digits;
	return Math.round((num + Number.EPSILON) * pow) / pow;
}

class modbus extends EventEmitter {
	constructor( modbusConfig ) {
		super();
		const self = this;
		self.config = {
				ip : modbusConfig.ip,
				port : modbusConfig.port,
				id : modbusConfig.id,
				byteOrder : modbusConfig.byteOrder || [2,3,0,1],
				decimalDigits : modbusConfig.decimalDigits || 3,
				debug : modbusConfig.debug ? modbusConfig.debug : false,
				timeout : modbusConfig.timeout || 100,
			};

		self._client = new ModbusRTU();

		self._isLittleEndian = (function() {
			const buffer = new ArrayBuffer(2);

			new DataView(buffer).setInt16(0, 256, true);  // littleEndian

			return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
		})();
	}

	_openClient(){
		const self = this;

		return new Promise(function(resolve, reject) {
			self._client.connectTCP(self.config.ip, {port : self.config.port}, function(err){

				self._client.setID(self.config.id);
				self._client.setTimeout(self.config.timeout);

				if(self._client.isOpen){
					resolve(true);
					return;
				}

				if(err){
					if(self.config.debug){
						console.error("client open Error",err);
					}

					self._client.close();
					return reject(err);
				}

				return resolve(self._client.isOpen);
			});
		});
	};

	readInputRegisters(addr,len = 1){
		const self = this;

		return self._openClient()
			.then(response => {
				return self._client.readInputRegisters(addr, len)
					.then(data => {
						return Buffer.from(data.buffer);
					})
					.catch(error => {
						if(self.config.debug){
							console.error('client.readInputRegisters error :',addr,error);
						}

						return Promise.reject(false);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('readInputRegisters error :',addr,error);
				}

				self._client.close();
				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	readHoldingRegisters(addr,len = 1){
		const self = this;

		return self._openClient()
			.then(response => {
				return self._client.readHoldingRegisters(addr, len)
					.then(data => {
						return Buffer.from(data.buffer);
					})
					.catch(error => {
						if(self.config.debug){
							console.error('client.readHoldingRegisters error :',addr,error);
						}

						return Promise.reject(false);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('readHoldingRegisters error :',addr,error);
				}

				self._client.close();
				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	writeRegister(addr,value){
		const self = this;

		return self._openClient()
			.then(response => {
				return self._client.writeRegister(addr, value)
					.then(data => {
						return data;
					})
					.catch(error => {
						if(self.config.debug){
							console.error('client.writeRegisters error :',addr,error);
						}

						return Promise.reject(false);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('writeRegister error :',addr,error);
				}

				self._client.close();
				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	writeRegisters(addr,value){
		const self = this;

		return self._openClient()
			.then(response => {
				self._client.setTimeout(self.config.timeout);
				return self._client.writeRegisters(addr, value)
					.then(data => {
						return data;
					})
					.catch(error => {
						if(self.config.debug){
							console.error('client.writeRegisters error :',addr,error);
						}

						return Promise.reject(false);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('writeRegisters error :',addr,error);
				}

				self._client.close();
				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	intToWords(num, type = 'WORD') {
		const self = this;

		const arr = new Uint8Array([
			 (num & 0x000000ff),
			 (num & 0x0000ff00) >> 8,
			 (num & 0x00ff0000) >> 16,
			 (num & 0xff000000) >> 24,
		]);

		const WORDS =[
				(arr[self.config.byteOrder[3]] << 8 | arr[self.config.byteOrder[2]]),
				(arr[self.config.byteOrder[1]] << 8 | arr[self.config.byteOrder[0]]),
			];

		return type == 'DWORD'
			? WORDS
			: (self.config.byteOrder[0] > self.config.byteOrder[3] ? [WORDS[0]] : [WORDS[1]]); // if byteOrder-0 > byteOrder-3, assume it Little Endian
	};

	floatToWords(num){
		const self = this;

		const buffer = new ArrayBuffer(4);
		const floatView = new Float32Array(buffer);

		floatView[0] = num;

		const intView = Array.from(new Uint8Array(buffer));
		const arr = self._isLittleEndian ? intView : intView.reverse();

		return [
			(arr[self.config.byteOrder[3]] << 8 | arr[self.config.byteOrder[2]]),
			(arr[self.config.byteOrder[1]] << 8 | arr[self.config.byteOrder[0]]),
		];
	};

	doubleToWords(num){
		const self = this;

		const buffer = new ArrayBuffer(8);
		const floatView = new Float64Array(buffer);

		floatView[0] = num;

		const intView = Array.from(new Uint8Array(buffer));
		const arr = self._isLittleEndian ? intView : intView.reverse();

		return [
			(arr[self.config.byteOrder[3]] << 8 | arr[self.config.byteOrder[2]]),
			(arr[self.config.byteOrder[1]] << 8 | arr[self.config.byteOrder[0]]),
			(arr[4 + self.config.byteOrder[3]] << 8 | arr[4 + self.config.byteOrder[2]]),
			(arr[4 + self.config.byteOrder[1]] << 8 | arr[4 + self.config.byteOrder[0]]),
		];
	};

	numToWords(value = 0,type){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw "wordsToNum() : type must be string";
		}

		switch(type.toUpperCase()){
			case 'UINT16':
			case 'INT16': {
				return self.intToWords(value, "WORD");
				break;
			}

			case 'UINT32':
			case 'INT32': {
				return self.intToWords(value, "DWORD");
				break;
			}

			case 'FLOAT':
			case 'FLOAT32': {
				return self.floatToWords(value);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return self.doubleToWords(value);
				break;
			}

			default: {
				return __buffer.readUInt32BE();
				break;
			}
		}
	};

	wordsToNum(__buffer,type, mode = "read", digits = undefined){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw "wordsToNum() : type must be string";
		}

		if(mode != "read" && mode != "write"){
			throw "wordsToNum() : mode must be 'read' or 'write'";
		}

		if(mode === "read"){
			switch(self.byteLength(type)){
				case 8: {
					__buffer = Buffer.from([
							__buffer[4 + self.config.byteOrder[0]],
							__buffer[4 + self.config.byteOrder[1]],
							__buffer[4 + self.config.byteOrder[2]],
							__buffer[4 + self.config.byteOrder[3]],
							__buffer[self.config.byteOrder[0]],
							__buffer[self.config.byteOrder[1]],
							__buffer[self.config.byteOrder[2]],
							__buffer[self.config.byteOrder[3]],
						]);

					break;
				}
				case 4: {
					__buffer = Buffer.from([
							__buffer[self.config.byteOrder[0]],
							__buffer[self.config.byteOrder[1]],
							__buffer[self.config.byteOrder[2]],
							__buffer[self.config.byteOrder[3]],
						]);
					break;
				}
			}
		}

		switch(type.toUpperCase()){
			case 'INT16': {
				return __buffer.readInt16BE();
				break;
			}

			case 'UINT16': {
				return __buffer.readUInt16BE();
				break;
			}

			case 'INT32': {
				return __buffer.readInt32BE();
				break;
			}

			case 'UINT32': {
				return __buffer.readUInt32BE();
				break;
			}

			case 'FLOAT':
			case 'FLOAT32': {
				return _round(__buffer.readFloatBE(), digits == undefined ? self.config.decimalDigits : digits);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return _round(__buffer.readDoubleBE(), digits == undefined ? self.config.decimalDigits : digits);
				break;
			}

			default: {
				return __buffer.readUInt32BE();
				break;
			}
		}
	};

	byteLength(type){
		if(!type || typeof(type) !== 'string'){
			throw "byteLength() : type must be string";
		}

		switch(type.toUpperCase()){
			case 'INT16':
			case 'UINT16': {
				return 2;
				break;
			}

			case 'FLOAT':
			case 'FLOAT32':
			case 'INT32':
			case 'UINT32': {
				return 4;
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return 8;
				break;
			}

			default: {
				return 4;
				break;
			};
		}
	};

	wordsLength(type){
		const self = this;
		return self.byteLength(type) / 2;
	};
}

module.exports = modbus;
