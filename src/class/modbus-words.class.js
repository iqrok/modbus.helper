'use strict';

function _round(num, digits = 2){
	const pow = 10 ** digits;
	return Math.round((num + Number.EPSILON) * pow) / pow;
}

class __words{
	constructor({byteOrder, decimalDigits}){
		this.initialize({byteOrder, decimalDigits});
	}

	initialize({byteOrder, decimalDigits}){
		const self = this;
		self.config = {
				byteOrder,
				decimalDigits,
			};
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
			: (self.config.byteOrder[0] > self.config.byteOrder[3] ? [WORDS[0]] : [WORDS[1]]); // if byteOrder-0 > byteOrder-3, assume it's Little Endian
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
			throw 'numToWords() : type must be string';
		}

		switch(type.toUpperCase()){
			case 'UINT16':
			case 'INT16': {
				return self.intToWords(value, 'WORD');
				break;
			}

			case 'UINT32':
			case 'INT32': {
				return self.intToWords(value, 'DWORD');
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

	wordsToNum(__buffer,type, mode = 'read', digits = undefined){
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

module.exports = __words;
