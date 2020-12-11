const ModbusRTU = require('modbus-serial');
const modbusWords = require('./modbus-words.class.js');

'use strict';

/**
 * @class
 * @extends modbusWords
 * */
class modbus extends modbusWords{
	/**
	 * @constructor
	 * @param {string} ip - IP destination for modbus TCP
	 * @param {number|string} port - Port number for modbus TCP or path to serial port for modbus RTU
	 * @param {number} baud - Baud Rate for modbus RTU
	 * @param {number[]} [byteOrder=[0,1,2,3]] - byte order of modbus register
	 * @param {number} [decimalDigits=3] - number of decimals for floating point
	 * @param {number} [timeout=100] - timeout in ms
	 * @param {boolean} [debug=false] - Print debug message
	 */
	constructor({ip, port, baud, id = 1, byteOrder = [0,1,2,3], decimalDigits = 3, debug = false, timeout = 100}) {
		super({byteOrder, decimalDigits});
		const self = this;

		self.config = {
				ip,
				port,
				baud,
				id,
				byteOrder,
				decimalDigits,
				debug,
				timeout,
			};

		self._client = new ModbusRTU();

		/**
		 * Connection type either TCP or RTU
		 * Automatically set based on IP, port, and baud values
		 * */
		self._connectionType = (function(){
				if(typeof(self.config.ip) === 'string' && String(self.config.ip).match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/)){
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
							baudRate: self.config.baud,
						},
					};

					return 'RTU';
				}
			})();

		/**
		 * check if current process is in little Endian machine or not
		 * */
		self._isLittleEndian = (function() {
				const buffer = new ArrayBuffer(2);
				new DataView(buffer).setInt16(0, 256, true);  // littleEndian

				return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
			})();
	}

	/**
	 * open connection to target modbus server
	 * @private
	 * */
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

	/**
	 * Read Input Register
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Buffer>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve read Buffer
	 * */
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

	/**
	 * Read Holding Register
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Buffer>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve read Buffer
	 * */
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

	/**
	 * Write single Holding Register
	 * @param {number} addr - address to write
	 * @param {number} value - value to write
	 * @return {Promise.<Object>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
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

	/**
	 * Write multiple Holding Registers
	 * @param {number} addr - address to write
	 * @param {number[]} value - array of values to write
	 * @return {Promise.<Object>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
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
