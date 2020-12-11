const __modbus = require('./');
const modbus = new __modbus({
		ip: '127.0.0.1',
		port: 502,
		id: 1,
		byteOrder: [0,1,2,3],
		decimalDigits: 6,
		debug: true,
		timeout: 1000,
	});

console.log('is Little Endian?', modbus._isLittleEndian); // true or false

const numbers = [
	{
		value: -32,
		type: 'int16',
	},
	{
		value: -32,
		type: 'uint16',
	},
	{
		value: 64,
		type: 'uint16',
	},
	{
		value: 0xff11eeaa,
		type: 'uint32',
	},
	{
		value: 123456,
		type: 'int32',
	},
	{
		value: -123456,
		type: 'int32',
	},
	{
		value: 0.123456,
		type: 'float32',
	},
	{
		value: 0.1234567890123456789,
		type: 'float64',
	},
];

(async () => {
	const values = [];
	let address = 0;

	for(const tmp of numbers){
		console.log('==  ==================================');
		console.log('address:', address);

		const value = modbus.numToWords(tmp.value, tmp.type);
		const directConvertion = modbus.wordsToNum(value, tmp.type);
		console.log('bytes:',value.map(item => item.toString(16)));
		console.log('convert:', tmp.value, directConvertion, directConvertion == tmp.value);

		const write = await modbus.writeRegisters(address,[...value]);
		console.log('write:',write);

		const read = await modbus.readHoldingRegisters(address, modbus.wordsLength(tmp.type));
		const number = modbus.wordsToNum(read, tmp.type);
		console.log('read:', read);
		console.log('type:', tmp.type);
		console.log('modbus:', tmp.value, number, number == tmp.value);

		address += modbus.wordsLength(tmp.type);
	}
})();
