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
	 * @param {number[]} [byteOrder=[1,0,3,2]] - byte order of modbus register
	 * @param {?number} [decimalDigits] - number of decimals for floating point
	 * @param {number} [timeout=100] - timeout in ms
	 * @param {boolean} [debug=false] - Print debug message
	 */
	constructor({ip, port, baud, id = 1, byteOrder = [1,0,3,2], decimalDigits, debug = false, timeout = 100}) {
		super({byteOrder, decimalDigits});
		const self = this;

		self._config = {
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
				if(typeof(self._config.ip) === 'string' && String(self._config.ip).match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/)){
					self._connectionOpt = {
						dst: self._config.ip,
						options: {
							port: self._config.port == undefined ? 502 : self._config.port,
						},
					};

					return 'TCP';
				}

				if(typeof(self._config.port) === 'string' && typeof(self._config.baud) === 'number'){
					self._connectionOpt = {
						dst: self._config.port,
						options: {
							baudRate: self._config.baud,
						},
					};

					return 'RTU';
				}
			})();
	}

	/**
	 * open connection to target modbus server
	 * @private
	 * @return {Promise} Will resolve client Object if successful, otherwise will reject error
	 * */
	_openClient(){
		const self = this;

		return new Promise(function(resolve, reject) {
			switch(self._connectionType){
				case 'TCP': {
					self._client.connectTCP(self._connectionOpt.dst, self._connectionOpt.options, function(error){
						if(error){
							return reject(error);
						}

						self._client.setID(self._config.id);
						self._client.setTimeout(self._config.timeout);

						return resolve(self._client);
					});

					break;
				}

				case 'RTU': {
					self._client.connectRTU(self._connectionOpt.dst, self._connectionOpt.options, function(error){
						if(error){
							return reject(error);
						}

						self._client.setID(self._config.id);
						self._client.setTimeout(self._config.timeout);

						return resolve(self._client);
					});

					break;
				}

				default:{
					return reject('Error: Connection Type is not defined.')
					break;
				}
			}
		});
	};

	/**
	 * Read Input Register (FC=4)
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Buffer>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve read Buffer
	 * */
	readInputRegisters(addr, len = 1){
		const self = this;

		return self._openClient()
			.then(_client => _client.readInputRegisters(addr, len))
			.then(response => response.buffer)
			.catch(error => {
				if(self._config.debug){
					console.error('readInputRegisters error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Read Holding Register (FC=3)
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Buffer>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve read Buffer
	 * */
	readHoldingRegisters(addr, len = 1){
		const self = this;

		return self._openClient()
			.then(_client => _client.readHoldingRegisters(addr, len))
			.then(response => response.buffer)
			.catch(error => {
				if(self._config.debug){
					console.error('readHoldingRegisters error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Read Discrete Inputs (FC=2)
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Boolean[]>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve array of discrete inputs status
	 * */
	readDiscreteInputs(addr, len = 1){
		const self = this;

		return self._openClient()
			.then(_client => _client.readDiscreteInputs(addr, len))
			.then(response => response.data.slice(0,len))
			.catch(error => {
				if(self._config.debug){
					console.error('readDiscreteInputs error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Read Coils (FC=1)
	 * @param {number} addr - address to read from
	 * @param {number} [len=1] - number of addresses to read
	 * @return {Promise.<Boolean[]>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve array of coils status
	 * */
	readCoils(addr, len = 1){
		const self = this;

		return self._openClient()
			.then(_client => _client.readCoils(addr, len))
			.then(response => response.data.slice(0,len))
			.catch(error => {
				if(self._config.debug){
					console.error('readCoils error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Write single Holding Register (FC=6)
	 * @param {number} addr - address to write
	 * @param {number} value - value to write
	 * @return {Promise.<Object>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
	writeRegister(addr, value){
		const self = this;

		return self._openClient()
			.then(_client => _client.writeRegister(addr, value))
			.then(response => response)
			.catch(error => {
				if(self._config.debug){
					console.error('writeRegister error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Write multiple Holding Registers (FC=16)
	 * @param {number} addr - address to write
	 * @param {number[]} values - array of valuess to write
	 * @return {Promise.<Object>|Promise.<Boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
	writeRegisters(addr, values){
		const self = this;

		return self._openClient()
			.then(_client => _client.writeRegisters(addr, values))
			.then(response => response)
			.catch(error => {
				if(self._config.debug){
					console.error('writeRegisters error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Write multiple Coils (FC=15)
	 * @param {number} addr - address to write
	 * @param {boolean[]} values - array of values to write
	 * @return {Promise.<Object>|Promise.<boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
	writeCoils(addr, values){
		const self = this;

		return self._openClient()
			.then(_client => _client.writeCoils(addr, values.map(value => value ? true : false)))
			.then(response => response)
			.catch(error => {
				if(self._config.debug){
					console.error('writeCoils error :', addr, error);
				}

				return false;
			})
			.finally(() => {
				self._client.close();
			});
	};

	/**
	 * Write Single Coil (modified FC=15)
	 * @param {number} addr - address to write
	 * @param {boolean} values - array of values to write
	 * @return {Promise.<Object>|Promise.<boolean>} - resolve false if reading is failed, otherwise resolve address and length of written registers
	 * */
	writeCoil(addr, value){
		const self = this;
		return self.writeCoils(addr, [value]);
	};
}

module.exports = modbus;
