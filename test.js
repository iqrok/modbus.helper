const __modbus = require('./');
const modbus = new __modbus({
		ip: '192.168.88.123',
		port: 502,
		id: 1,
		timeout: 75,
		debug: true,
	});

(async() => {
	const address = 0x01; // first address
	const values = [];

	const data = [
		{
			value: 2.545,
			type: 'float', // length is 2 WORDS
		},
		{
			value: 30,
			type: 'int16', // length is 1 WORD
		},
	];

	for(const _data of data){
		const bytes = modbus.numToWords(2.545, 'float'); // convert value into array of bytes
		values.push(...bytes);
	}

	const write = await modbus.writeRegisters(address, values); // request to write from address 0x01 to 0x03

	console.log('Wrtie status:', write);

	const read = await modbus.readHoldingRegisters(0x01, 2); // read from address 0x01 with length of 2 WORDS
	const number = modbus.wordsToNum(read, 'float')

	console.log('Read float:', number);
})();
