const bdAddress = require('@bangladeshi/bangladesh-address/build/src/index.js');
const fs = require('fs');

async function main() {
    try {
        console.log(Object.keys(bdAddress));
        
        if (bdAddress.allThana) {
            const thanas = bdAddress.allThana();
            console.log(`Found ${thanas.length} thanas`);
            fs.writeFileSync('data_thanas.json', JSON.stringify(thanas, null, 2));
        } else if (bdAddress.default && bdAddress.default.allThana) {
            const thanas = bdAddress.default.allThana();
            console.log(`Found ${thanas.length} thanas`);
            fs.writeFileSync('data_thanas.json', JSON.stringify(thanas, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

main();
