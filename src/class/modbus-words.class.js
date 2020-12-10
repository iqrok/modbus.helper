'use strict';

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
	 * @typedef {"WORD"|"DWORD"} wordType
	 * @private
	 * @param {number} num - number to be converted
	 * @param {wordType} [type='WORD'] - number type is either WORD or DWORD
	 * @return {number[]} - array of uint16 numbers
	 */
	_intToWords(num, type = 'WORD') {
		const self = this;

		const arr = new Uint8Array([
			 (num & 0x000000ff),
			 (num & 0x0000ff00) >> 8,
			 (num & 0x00ff0000) >> 16,
			 (num & 0xff000000) >> 24,
		]);

		const WORDS =[
			(arr[self.config.byteOrder[0]] << 8 | arr[self.config.byteOrder[1]]),
			(arr[self.config.byteOrder[2]] << 8 | arr[self.config.byteOrder[3]]),
		];

		return type == 'DWORD'
			? WORDS
			: [WORDS[0]]; // if byteOrder-0 > byteOrder-3, assume it's Little Endian
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
	 * @typedef {"UINT16"|"INT16"|"UINT32"|"INT32"|"FLOAT"|"FLOAT32"|"DOUBLE"|"FLOAT64"} numberType
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
				return __buffer.readUInt16LE();
				break;
			}
		}
	};

	/**
	 * Convert Words received from modbus to number
	 * @typedef {"read"|"write"} wordsConvertType
	 * @param {number[]} words - array of uint16 numbers to be converted
	 * @param {numberType} type - number data type
	 * @param {wordsConvertType} [mode="read"] - if type is "read" then the order of bytes will be reversed
	 * @param {number} [digits] - number of decimal digits, will be default to set decimalDigits in config if left undefined
	 * @return {number} - converted number
	 */
	wordsToNum(words, type, mode = 'read', digits){
		const self = this;

		if(!type || typeof(type) !== 'string'){
			throw 'wordsToNum() : type must be string';
		}

		if(mode != 'read' && mode != 'write'){
			throw 'wordsToNum() : mode must be "read" or "write"';
		}

		if(mode === 'read'){
			switch(self.byteLength(type)){
				case 8: {
					words = Buffer.from([
							words[self.config.byteOrder[0]],
							words[self.config.byteOrder[1]],
							words[self.config.byteOrder[2]],
							words[self.config.byteOrder[3]],
							words[4 + self.config.byteOrder[0]],
							words[4 + self.config.byteOrder[1]],
							words[4 + self.config.byteOrder[2]],
							words[4 + self.config.byteOrder[3]],
						]);

					break;
				}
				case 4: {
					words = Buffer.from([
							words[self.config.byteOrder[0]],
							words[self.config.byteOrder[1]],
							words[self.config.byteOrder[2]],
							words[self.config.byteOrder[3]],
						]);
					break;
				}
			}
		}

		switch(type.toUpperCase()){
			case 'INT16': {
				return words.readInt16LE();
				break;
			}

			case 'UINT16': {
				return words.readUInt16LE();
				break;
			}

			case 'INT32': {
				return words.readInt32LE();
				break;
			}

			case 'UINT32': {
				return words.readUInt32LE();
				break;
			}

			case 'FLOAT':
			case 'FLOAT32': {
				return _round(words.readFloatLE(), digits == undefined ? self.config.decimalDigits : digits);
				break;
			}

			case 'DOUBLE':
			case 'FLOAT64': {
				return _round(words.readDoubleLE(), digits == undefined ? self.config.decimalDigits : digits);
				break;
			}

			default: {
				return words.readUInt32LE();
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
