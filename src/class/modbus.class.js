const ModbusRTU = require('modbus-serial');
const modbusWords = require('./modbus-words.class.js');

'use strict';

class modbus extends modbusWords{
	constructor( config ) {
		super(config);
		const self = this;

		self.config = {
				ip: config.ip,
				port: config.port,
				baud: config.baud,
				id: config.id,
				byteOrder: config.byteOrder || [2,3,0,1],
				decimalDigits: config.decimalDigits || 3,
				debug: config.debug ? config.debug: false,
				timeout: config.timeout || 100,
			};

		self._client = new ModbusRTU();

		self._connectionType = (function(){
				if(String(self.config.ip).match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/)){
					self._connectionOpt = {
						dst: self.config.ip,
						options: {
							port: self.config.port == undefined ? 502 : self.config.port,
						},
					};

					return 'TCP';
				}

				if(typeof(self.config.port) === 'string' && typeof(self.config.baud) === 'number'){
					self._connectionOpt = {
						dst: self.config.port,
						options: {
							baudRate: self.config.baud == undefined ? 9600 : self.config.baud,
						},
					};

					return 'RTU';
				}
			})();

		self._isLittleEndian = (function() {
				const buffer = new ArrayBuffer(2);
				new DataView(buffer).setInt16(0, 256, true);  // littleEndian

				return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
			})();
	}

	_openClient(){
		const self = this;

		return new Promise(function(resolve, reject) {
			switch(self._connectionType){
				case 'TCP': {
					self._client.connectTCP(self._connectionOpt.dst, self._connectionOpt.options, function(err){
						self._client.setID(self.config.id);
						self._client.setTimeout(self.config.timeout);

						if(self._client.isOpen){
							resolve(true);
							return;
						}

						if(err){
							if(self.config.debug){
								console.error('client open Error', err);
							}

							self._client.close();
							return reject(err);
						}

						resolve(self._client.isOpen);
						return;
					});

					break;
				}

				case 'RTU': {
					self._client.connectRTU(self._connectionOpt.dst, self._connectionOpt.options, function(err){
						self._client.setID(self.config.id);
						self._client.setTimeout(self.config.timeout);

						if(self._client.isOpen){
							resolve(true);
							return;
						}

						if(err){
							if(self.config.debug){
								console.error('client open Error', err);
							}

							self._client.close();
							return reject(err);
						}

						resolve(self._client.isOpen);
						return;
					});

					break;
				}

				default:{
					reject('Error: Connection Type is not defined.', self._connectionType)
					break;
				}
			}
		});
	};

	readInputRegisters(addr,len = 1){
		const self = this;

		return self._openClient()
			.then(response => {
				return self._client.readInputRegisters(addr, len)
					.then(data => Buffer.from(data.buffer))
					.catch(error => {
						if(self.config.debug){
							console.error('client.readInputRegisters error :', addr, error);
						}

						return Promise.reject(error);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('readInputRegisters error :', addr, error);
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
					.then(data => Buffer.from(data.buffer))
					.catch(error => {
						if(self.config.debug){
							console.error('client.readHoldingRegisters error :', addr, error);
						}

						return Promise.reject(error);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('readHoldingRegisters error :', addr, error);
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
					.then(data => data)
					.catch(error => {
						if(self.config.debug){
							console.error('client.writeRegisters error :', addr, error);
						}

						return Promise.reject(error);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('writeRegister error :', addr, error);
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
					.then(data => data)
					.catch(error => {
						if(self.config.debug){
							console.error('client.writeRegisters error :', addr, error);
						}

						return Promise.reject(error);
					});
			})
			.catch(error => {
				if(self.config.debug){
					console.error('writeRegisters error :', addr, error);
				}

				self._client.close();
				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};
}

module.exports = modbus;
