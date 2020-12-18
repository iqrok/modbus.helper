'use strict';
/**
 * @typedef {("UINT16"|"INT16"|"UINT32"|"INT32"|"FLOAT"|"FLOAT32"|"DOUBLE"|"FLOAT64")} numberType
 * */

/**
 * Round floating number to n digits
 * @private
 * @param {number} number - number to be rounded
 * @param {number} [digits=2] - number of decimal digits
 * @return {number} - Rounded Number
 * */
function _round(num, digits = 2){
	const pow = 10 ** digits;
	return Math.round((num + Number.EPSILON) * pow) / pow;
}

let _config = {
		byteOrder: undefined,
		decimalDigits: undefined,
	};

/**
 * @class
 * @package
 * */
class modbusWords{
	/**
	 * @constructor
	 * @param {number[]} byteOrder - byte order of modbus register
	 * @param {number} decimalDigits - number of decimals for floating point
	 */
	constructor({byteOrder, decimalDigits}){
		this._initialize({byteOrder, decimalDigits});
	}

	/**
	 * initialize configuration
	 * @private
	 * @param {number[]} byteOrder - byte order of modbus register
	 * @param {number} decimalDigits - number of decimals for floating point
	 */
	_initialize({byteOrder, decimalDigits}){
		const self = this;

		_config.byteOrder = byteOrder;
		_config.decimalDigits = decimalDigits;

		/**
		 * size of byte order, should return 4
		 * storing the size, in case there is possibility to expand it in the future
		 * @private
		 * */
		self._byteOrderLength = _config.byteOrder.length,

		self._bigEndianNotSwapped = (function(){
				let lastOrder = undefined;
				for(const order of _config.byteOrder){
					if(lastOrder === undefined){
						lastOrder = order;
						continue;
					}

					if(lastOrder < order){
						return false;
					}

					lastOrder = order;
				}

				return true;
			})();

		/**
		 * check if current process is in little Endian machine or not
		 * @public
		 * */
		self.isLittleEndian = (function() {
				const buffer = new ArrayBuffer(2);
				new DataView(buffer).setInt16(0, 256, true);  // littleEndian

				return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
			})();
	};

	/**
	 * Convert integer number to array of unsigned integer 16-bits numbers
	 * @private
	 * @param {number} num - number to be converted
	 * @param {number} byteLength - byte length of number
	 * @return {number[]} - array of uint16 numbers
	 */
	_intToWords(num, byteLength) {
		const self = this;

		switch(byteLength){
			case 2: {
				const byteArray = new Uint8Array([
					 (num & 0x00FF),
					 (num & 0xFF00) >> 8,
				]);

				// return as BigEndian if 1st byte comes before 0th byte, otherwise return as Little Endian
				for(const order of _config.byteOrder){
					if(order === 1){
						return [(byteArray[1] << 8 | byteArray[0])];
					}

					if(order === 0){
						return [(byteArray[0] << 8 | byteArray[1])];
					}
				}
				break;
			}

			case 4: {
				const byteArray = new Uint8Array([
					 (num & 0x000000FF),
					 (num & 0x0000FF00) >> 8,
					 (num & 0x00FF0000) >> 16,
					 (num & 0xFF000000) >> 24,
				]);

				return [
					(byteArray[_config.byteOrder[0]] << 8 | byteArray[_config.byteOrder[1]]),
					(byteArray[_config.byteOrder[2]] << 8 | byteArray[_config.byteOrder[3]]),
				];
				break;
			}
		}

		throw false;
	};

	/**
	 * Convert floating number to array of unsigned integer 16-bits numbers
	 * @private
	 * @param {number} num - number to be converted
	 * @return {number[]} - array of uint16 numbers
	 */
	_floatToWords(num){
		const self = this;

		const buffer = new ArrayBuffer(4);
		const floatView = new Float32Array(buffer);

		floatView[0] = num;

		const arr = Array.from(new Uint8Array(buffer));

		return [
			(arr[_config.byteOrder[0]] << 8 | arr[_config.byteOrder[1]]),
			(arr[_config.byteOrder[2]] << 8 | arr[_config.byteOrder[3]]),
		];
	};

	/**
	 * Convert double (float 64-bits) number to array of unsigned integer 16-bits numbers
	 * @private
	 * @param {number} num - number to be converted
	 * @return {number[]} - array of uint16 numbers
	 */
	_doubleToWords(num){
		const self = this;

		const buffer = new ArrayBuffer(8);
		const floatView = new Float64Array(buffer);

		floatView[0] = num;

		const arr = Array.from(new Uint8Array(buffer));

		return self._bigEndianNotSwapped
			? [
				(arr[self._byteOrderLength + _config.byteOrder[0]] << 8 | arr[self._byteOrderLength + _config.byteOrder[1]]),
				(arr[self._byteOrderLength + _config.byteOrder[2]] << 8 | arr[self._byteOrderLength + _config.byteOrder[3]]),
				(arr[_config.byteOrder[0]] << 8 | arr[_config.byteOrder[1]]),
				(arr[_config.byteOrder[2]] << 8 | arr[_config.byteOrder[3]]),
			]
			: [
				(arr[_config.byteOrder[0]] << 8 | arr[_config.byteOrder[1]]),
				(arr[_config.byteOrder[2]] << 8 | arr[_config.byteOrder[3]]),
				(arr[self._byteOrderLength + _config.byteOrder[0]] << 8 | arr[self._byteOrderLength + _config.byteOrder[1]]),
				(arr[self._byteOrderLength + _config.byteOrder[2]] << 8 | arr[self._byteOrderLength + _config.byteOrder[3]]),
			];
	};

	/**
	 * Convert number into array of unsigned integer 16-bits numbers
	 * @param {number} number - number to be converted
	 * @param {numberType} type - number data type
	 * @return {number[]} - array of uint16 numbers
	 */
	numToWords(number, type){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw 'numToWords() : type must be string';
		}

		switch(type.toUpperCase()){
			case 'UINT16':
			case 'INT16': {
				return self._intToWords(number, self.byteLength(type));
				break;
			}

			case 'UINT32':
			case 'INT32': {
				return self._intToWords(number, self.byteLength(type));
				break;
			}

			case 'FLOAT':
			case 'FLOAT32': {
				return self._floatToWords(number);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return self._doubleToWords(number);
				break;
			}

			default: {
				return 0;
				break;
			}
		}
	};

	/**
	 * Convert Buffer or array of uint16 into Little Endian Buffer
	 * @private
	 * @param {Buffer|Array.<uint16>} words - Buffer or array of uint16 numbers to be converted
	 * @param {numberType} type - number data type
	 * @return {Buffer}
	 */
	_wordsToBuffer(words){
		const self = this;

		if(!Array.isArray(words) && !Buffer.isBuffer(words)){
			throw `Should pass Array instead of ${typeof(words)}!`;
		}

		const wordLength = words.length;
		const byteArray = (function(){
				if(Array.isArray(words)){
					const _tmpArray = [];

					for(const word of words){
						_tmpArray.push((word & 0xFF00) >> 8);
						_tmpArray.push((word & 0x00FF) >> 0);
					}

					return _tmpArray;
				}

				return Array.from(words);
			})();

		const byteLength = byteArray.length;
		const reorderedArray = [];
		for(let idx = 0, _counter = 0; _counter < byteLength; ++idx){
			if(_config.byteOrder[idx] >= byteLength){
				continue;
			}

			const pos = _config.byteOrder[idx] != undefined
				? _config.byteOrder[idx]
				: self._byteOrderLength + _config.byteOrder[idx - self._byteOrderLength];

			reorderedArray[pos] = byteArray[_counter++];
		}

		return Buffer.from(
			byteLength > self._byteOrderLength && self._bigEndianNotSwapped
				? [  ...reorderedArray.slice(4,8), ...reorderedArray.slice(0,4), ]
				: reorderedArray
		);
	};

	/**
	 * Convert Words received from modbus to number
	 * @param {Buffer|Array.<uint16>} words - Buffer or array of uint16 numbers to be converted
	 * @param {numberType} type - number data type
	 * @param {?number} [digits] - number of decimal digits for float, will be default to set decimalDigits in config if left undefined
	 * @return {number} - converted number
	 */
	wordsToNum(words, type, digits){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw 'wordsToNum() : type must be string';
		}

		const _buffer = self._wordsToBuffer(words, self.byteLength(type));

		switch(type.toUpperCase()){
			case 'INT16': {
				return _buffer.readInt16LE();
				break;
			}

			case 'UINT16': {
				return _buffer.readUInt16LE();
				break;
			}

			case 'INT32': {
				return _buffer.readInt32LE();
				break;
			}

			case 'UINT32': {
				return _buffer.readUInt32LE();
				break;
			}

			case 'FLOAT':
			case 'FLOAT32': {
				return digits == undefined && _config.decimalDigits == undefined
					? _buffer.readFloatLE()
					: _round(_buffer.readFloatLE(), digits == undefined ? _config.decimalDigits : digits);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return digits == undefined && _config.decimalDigits == undefined
					? _buffer.readDoubleLE()
					: _round(_buffer.readDoubleLE(), digits == undefined ? _config.decimalDigits : digits);
				break;
			}

			default: {
				return _buffer.readUint16LE();
				break;
			}
		}
	};

	/**
	 * Size of data type in bytes
	 * @param {numberType} type - number data type
	 * @return {number} - data type size in bytes
	 */
	byteLength(type){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw 'byteLength() : type must be string';
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
				return self._getByteSizeFromString(type);
				break;
			};
		}
	};


	/**
	 * Get byte size from tpye name, i.e. 'FLOAT64' will return 64. If no number is found, will return 0
	 * @param {type} type - data type name
	 * @return {number} - data type size in byte
	 */
	_getByteSizeFromString(type){
		const numbers = String(type).match(/(([\d])+$)/g);
		return numbers
			? +numbers[0]
			: 0;
	};

	/**
	 * Size of data type in words
	 * @param {numberType} type - number data type
	 * @return {number} - data type size in words
	 */
	wordsLength(type){
		const self = this;
		return self.byteLength(type) / 2;
	};
}

module.exports = modbusWords;
