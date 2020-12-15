const __modbus = require('./');
const modbus = new __modbus({
		ip: '127.0.0.1',
		port: 502,
		id: 1,
		byteOrder: [1,0,3,2],
		decimalDigits: null,
		debug: true,
		timeout: 1000,
	});

console.log('is Little Endian?', modbus.isLittleEndian); // true or false

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
		digits: 6,
	},
	{
		value: -10.123456,
		type: 'float32',
		digits: 6,
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
		const number = modbus.wordsToNum(read, tmp.type, tmp.digits);
		console.log('read:', read);
		console.log('type:', tmp.type);
		console.log('modbus:', tmp.value, number, number == tmp.value);

		address += modbus.wordsLength(tmp.type);
	}

	const writeCoils = await modbus.writeCoils(0, [1,0,0,1,0]);
	console.log('writeCoils', writeCoils);
	const readCoils = await modbus.readCoils(0, 5);
	console.log('readCoils', readCoils);
	const readDiscreteInputs = await modbus.readDiscreteInputs(0, 5);
	console.log('readDiscreteInputs', readDiscreteInputs);
})();
