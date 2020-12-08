const EventEmitter = require('events');
const ModbusRTU = require("modbus-serial");

'use strict;'
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

		self.client = new ModbusRTU();

		// changed opening client method from callback to promise
		self.openClient = function() {
			return new Promise(function(resolve, reject) {
				self.client.connectTCP(self.config.ip, {port : self.config.port}, function(err){
					//set id for first time connection
					self.client.setID(self.config.id);

					if(self.client.isOpen){
						resolve(true);
						return;
					}

					if(err){
						if(self.config.debug)
							console.error("client open Error",err);

						self.client.close();
						return reject(err);
					}

					return resolve(self.client.isOpen);
				});
			});
		}

	}

	readInputRegisters(addr,len = 1){
		const self = this;

		// return register value
		return self.openClient()
			.then(response => {
				self.client.setTimeout(self.config.timeout);
				return self.client.readInputRegisters(addr, len)
					.then(data => {
						return Buffer.from(data.buffer);
					})
					.catch(error => {
						if(self.config.debug)
							console.error('client.readInputRegisters error :',addr,error);

						return new Promise((resolve,reject) => {
								reject(false);
							});
					})
					.finally(() => {
						//~ self.client.close();
					});
			})
			.catch(error => {
				if(self.config.debug)
					console.error('readInputRegisters error :',addr,error);

				self.client.close();
				return false;
			})
			.finally(() => {
				self.client.close();
			});
	};

	readHoldingRegisters(addr,len = 1){
		const self = this;

		// return register value
		return self.openClient()
			.then(response => {
				self.client.setTimeout(self.config.timeout);
				return self.client.readHoldingRegisters(addr, len)
					.then(data => {
						return Buffer.from(data.buffer);
					})
					.catch(error => {
						if(self.config.debug)
							console.error('client.readHoldingRegisters error :',addr,error);

						return new Promise((resolve,reject) => {
								reject(false);
							});
					})
					.finally(() => {
						//~ self.client.close();
					});
			})
			.catch(error => {
				if(self.config.debug)
					console.error('readHoldingRegisters error :',addr,error);

				self.client.close();
				return false;
			})
			.finally(() => {
				self.client.close();
			});
	};

	writeRegister(addr,value){
		const self = this;

		// return register value
		return self.openClient()
			.then(response => {
				self.client.setTimeout(self.config.timeout);
				return self.client.writeRegister(addr, value)
					.then(data => {
						return data;
					})
					.catch(error => {
						if(self.config.debug)
							console.error('client.writeRegisters error :',addr,error);

						return new Promise((resolve,reject) => {
								reject(false);
							});
					})
					.finally(() => {
						//~ self.client.close();
					});
			})
			.catch(error => {
				if(self.config.debug)
					console.error('writeRegisters error :',addr,error);

				self.client.close();
				return false;
			})
			.finally(() => {
				self.client.close();
			});
	};

	writeRegisters(addr,value){
		const self = this;

		// return register value
		return self.openClient()
			.then(response => {
				self.client.setTimeout(self.config.timeout);
				return self.client.writeRegisters(addr, value)
					.then(data => {
						return data;
					})
					.catch(error => {
						if(self.config.debug)
							console.error('client.writeRegisters error :',addr,error);

						return new Promise((resolve,reject) => {
								reject(false);
							});
					})
					.finally(() => {
						//~ self.client.close();
					});
			})
			.catch(error => {
				if(self.config.debug)
					console.error('writeRegisters error :',addr,error);

				self.client.close();
				return false;
			})
			.finally(() => {
				self.client.close();
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

		return type == 'WORD'
			? (self.config.byteOrder[0] > self.config.byteOrder[3] ? [WORDS[0]] : [WORDS[1]]) // if byteOrder-0 > byteOrder-3, assume it Little Endian
			: WORDS;
	};

	floatToWords(num){
		const self = this;

		const buffer = new ArrayBuffer(4);
		const intView = new Int32Array(buffer);
		const floatView = new Float32Array(buffer);

		floatView[0] = num;

		const arr = [
				(intView[0] >>  0) & 0xFF,
				(intView[0] >>  8) & 0xFF,
				(intView[0] >> 16) & 0xFF,
				(intView[0] >> 24) & 0xFF,
			];

		const WORDS =[
				(arr[self.config.byteOrder[3]] << 8 | arr[self.config.byteOrder[2]]),
				(arr[self.config.byteOrder[1]] << 8 | arr[self.config.byteOrder[0]]),
			];

		return WORDS;
	};

	numToWords(value = 0,type){
		const self = this;

		if(!type){
			throw "numToWords() : type must be defined";
		}

		if(type === "int32"){
			return self.intToWords(value,"DWORD");
		}
		else if(type === "int16"){
			return self.intToWords(value,"WORD");
		}
		else{
			return self.floatToWords(value); // assume it's float
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

		if(mode === "read" && self.byteLength(type) > 2){
			__buffer = Buffer.from([
					__buffer[self.config.byteOrder[0]],
					__buffer[self.config.byteOrder[1]],
					__buffer[self.config.byteOrder[2]],
					__buffer[self.config.byteOrder[3]],
				]);
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
				return +__buffer.readFloatBE().toFixed(digits == undefined ? self.config.decimalDigits : digits);
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
			case 'FLOAT64':
			case 'INT64':
			case 'UINT64': {
				return 8;
				break;
			}

			default: {
				return 4;
				break;
			};
		}
	};
}

module.exports = modbus;
