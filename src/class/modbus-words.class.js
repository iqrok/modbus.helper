'use strict';
/**
 * @typedef {("UINT16"|"INT16"|"UINT32"|"INT32"|"FLOAT"|"FLOAT32"|"DOUBLE"|"FLOAT64")} numberType
 * */
/**
 * @typedef {"WORD"|"DWORD"} wordType
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
		self.config = {
				byteOrder,
				decimalDigits,
			};
	};

	/**
	 * Convert integer number to array of unsigned integer 16-bits numbers
	 * @private
	 * @param {number} num - number to be converted
	 * @param {wordType} [type='WORD'] - number type is either WORD or DWORD
	 * @return {number[]} - array of uint16 numbers
	 */
	_intToWords(num, type = 'WORD') {
		const self = this;

		const arr = new Uint8Array([
			 (num & 0x000000FF),
			 (num & 0x0000FF00) >> 8,
			 (num & 0x00FF0000) >> 16,
			 (num & 0xFF000000) >> 24,
		]);

		const WORDS =[
			(arr[self.config.byteOrder[0]] << 8 | arr[self.config.byteOrder[1]]),
			(arr[self.config.byteOrder[2]] << 8 | arr[self.config.byteOrder[3]]),
		];

		return type == 'DWORD'
			? WORDS
			: [WORDS[0]];
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

		const intView = Array.from(new Uint8Array(buffer));
		const arr = self._isLittleEndian ? intView : intView.reverse();

		return [
			(arr[self.config.byteOrder[0]] << 8 | arr[self.config.byteOrder[1]]),
			(arr[self.config.byteOrder[2]] << 8 | arr[self.config.byteOrder[3]]),
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

		const intView = Array.from(new Uint8Array(buffer));
		const arr = self._isLittleEndian ? intView : intView.reverse();

		return [
			(arr[self.config.byteOrder[0]] << 8 | arr[self.config.byteOrder[1]]),
			(arr[self.config.byteOrder[2]] << 8 | arr[self.config.byteOrder[3]]),
			(arr[4 + self.config.byteOrder[0]] << 8 | arr[4 + self.config.byteOrder[1]]),
			(arr[4 + self.config.byteOrder[2]] << 8 | arr[4 + self.config.byteOrder[3]]),
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
				return self._intToWords(number, 'WORD');
				break;
			}

			case 'UINT32':
			case 'INT32': {
				return self._intToWords(number, 'DWORD');
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
	 * Convert array of uint16 into Buffer, if Buffer is passed instead, will return the passed Buffer
	 * @private
	 * @param {Buffer|Array.<uint16>} words - number to be converted
	 * @param {numberType} type - number data type
	 * @return {number[]} - array of uint16 numbers
	 */
	_wordsToBuffer(words){
		const self = this;

		if(Buffer.isBuffer(words)){
			return words;
		}

		if(!Array.isArray(words)){
			throw `Should pass Array instead of ${typeof(words)}!`;
		}

		const len = words.length;
		const tmp = [];
		for(let idx = 0; idx < len; ++idx){
			// in Big Endian format, MSB comes first
			tmp.push(
				(words[idx] & 0xFF00) >> 8,
				(words[idx] & 0x00FF) >> 0,
			);
		}

		return Buffer.from(tmp);
	};

	/**
	 * Convert Words received from modbus to number
	 * @param {Buffer|number[]} words - Buffer or array of uint16 numbers to be converted
	 * @param {numberType} type - number data type
	 * @param {?number} [digits] - number of decimal digits, will be default to set decimalDigits in config if left undefined
	 * @return {number} - converted number
	 */
	wordsToNum(words, type, digits){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw 'wordsToNum() : type must be string';
		}

		const _buffer = self._wordsToBuffer(words);

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
				return _round(_buffer.readFloatLE(), digits == undefined ? self.config.decimalDigits : digits);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return _round(_buffer.readDoubleLE(), digits == undefined ? self.config.decimalDigits : digits);
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
				return 0;
				break;
			};
		}
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
