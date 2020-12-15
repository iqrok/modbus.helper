# modbus-serial Helper
Helper for modbus-serial package in async/await.

# USAGE
```javascript
const modbusHelper = require('@iqrok/modbus.helper');
const modbus =new modbusHelper({
		ip: '127.0.0.1',
		port: 502,
		id: 1,
		byteOrder: [1,0,3,2],
		decimalDigits: null,
		debug: true,
		timeout: 1000,
    });
```

## new modbusHelper ({ip, port, baud, byteOrder, decimalDigits, nullable, timeout, debug})

### Parameters:

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| `ip` | string |  |  | IP destination for modbus TCP |
| `port` | number\|string |  |  | Port number for modbus TCP or path to serial port for modbus RTU |
| `baud` | number |  |  | Baud Rate for modbus RTU |
| `byteOrder` | Array.\<number\> | \<optional\> | [1,0,3,2] | byte order of modbus register |
| `decimalDigits` | number | \<optional\> \<nullable\> |  | number of decimals for floating point |
| `timeout` | number | \<optional\> | 100 | timeout in ms |
| `debug` | boolean | \<optional\> | false | Print debug message |


## byteLength (type) → {number}

Size of data type in bytes

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `type` | "UINT16" \| "INT16" \| "UINT32" \| "INT32" \| "FLOAT" \| "FLOAT32" \| "DOUBLE" \| "FLOAT64" | number data type |


### Returns:

- data type size in bytes


## numToWords (number, type) → {Array.\\<number\\>}

Convert number into array of unsigned integer 16-bits numbers

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `number` | number | number to be converted |
| `type` | "UINT16" \| "INT16" \| "UINT32" \| "INT32" \| "FLOAT" \| "FLOAT32" \| "DOUBLE" \| "FLOAT64" | number data type |

### Returns:

- array of uint16 numbers

## readCoils (addr, len) → {Promise.\<Array.\<Boolean\>\>|Promise.\<Boolean\>}

Read Coils (FC=1)

### Parameters:

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| `addr` | number |  |  | address to read from |
| `len` | number | \<optional\> | 1 | number of addresses to read |


### Returns:

- resolve false if reading is failed, otherwise resolve array of coils status

## readDiscreteInputs (addr, len) → {Promise.\\<Array.\\<Boolean\\>\\>|Promise.\<Boolean\>}

Read Discrete Inputs (FC=2)

### Parameters:

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| `addr` | number |  |  | address to read from |
| `len` | number | \<optional\> | 1 | number of addresses to read |

### Returns:

- resolve false if reading is failed, otherwise resolve array of discrete inputs status

## readHoldingRegisters (addr, len) → {Promise.\<Buffer\>|Promise.\<Boolean\>}

Read Holding Register (FC=3)

### Parameters:

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| `addr` | number |  |  | address to read from |
| `len` | number | \<optional\> | 1 | number of addresses to read |

### Returns:

- resolve false if reading is failed, otherwise resolve read Buffer

## readInputRegisters (addr, len) → {Promise.\<Buffer\>|Promise.\<Boolean\>}

Read Input Register (FC=4)

### Parameters:

| Name | Type | Attributes | Default | Description |
| --- | --- | --- | --- | --- |
| `addr` | number |  |  | address to read from |
| `len` | number | \<optional\> | 1 | number of addresses to read |

### Returns:

- resolve false if reading is failed, otherwise resolve read Buffer

## wordsLength (type) → {number}

Size of data type in words

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `type` | "UINT16" \| "INT16" \| "UINT32" \| "INT32" \| "FLOAT" \| "FLOAT32" \| "DOUBLE" \| "FLOAT64" | number data type |

### Returns:

- data type size in words

## wordsToNum (words, type, digits, nullable) → {number}

Convert Words received from modbus to number

### Parameters:

| Name | Type | Attributes | Description |
| --- | --- | --- | --- |
| `words` | Buffer |Array.\<uint16\> |  | Buffer or array of uint16 numbers to be converted |
| `type` | "UINT16" \| "INT16" \| "UINT32" \| "INT32" \| "FLOAT" \| "FLOAT32" \| "DOUBLE" \| "FLOAT64" |  | number data type |
| `digits` | number | \<optional\> \<nullable\> | number of decimal digits for float, will be default to set decimalDigits in config if left undefined |

### Returns:

- converted number

## writeCoil (addr, values) → {Promise.\<Object\>|Promise.\<boolean\>}

Write Single Coil (modified FC=15)

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `addr` | number | address to write |
| `values` | boolean | array of values to write |

### Returns:

- resolve false if reading is failed, otherwise resolve address and length of written registers

## writeCoils (addr, values) → {Promise.\<Object\>|Promise.\<boolean\>}

Write multiple Coils (FC=15)

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `addr` | number | address to write |
| `values` | Array.\<boolean\> | array of values to write |

### Returns:

- resolve false if reading is failed, otherwise resolve address and length of written registers

## writeRegister (addr, value) → {Promise.\<Object\>|Promise.\<Boolean\>}

Write single Holding Register (FC=6)

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `addr` | number | address to write |
| `value` | number | value to write |


### Returns:

- resolve false if reading is failed, otherwise resolve address and length of written registers


## writeRegisters (addr, values) → {Promise.\<Object\>|Promise.\<Boolean\>}

Write multiple Holding Registers (FC=16)

### Parameters:

| Name | Type | Description |
| --- | --- | --- |
| `addr` | number | address to write |
| `values` | Array.\<number\> | array of valuess to write |

### Returns:

- resolve false if reading is failed, otherwise resolve address and length of written registers
