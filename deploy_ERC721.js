const Caver = require('caver-js');
const fs = require('fs')

const conf = JSON.parse(fs.readFileSync('deploy_conf.json', 'utf8'));
const bridgeAbi = JSON.parse(fs.readFileSync('build/Bridge.abi', 'utf8'));
const bridgeCode = fs.readFileSync('build/Bridge.bin', 'utf8');
const tokenAbi = JSON.parse(fs.readFileSync('build/ServiceChainNFT.abi', 'utf8'));
const tokenCode = fs.readFileSync('build/ServiceChainNFT.bin', 'utf8');

async function deploy(info) {

    const caver = new Caver(`http://${info.ip}:${info.port}`);
    info.sender = caver.klay.accounts.wallet.add(info.key).address

    try {
        // Deploy bridge
        const instanceBridge = new caver.klay.Contract(bridgeAbi);
        info.newInstanceBridge = await instanceBridge.deploy({data: bridgeCode, arguments:[true]})
            .send({ from: info.sender, gas: 100000000, value: 0 })
        info.bridge = info.newInstanceBridge._address

        // Deploy ERC721 token
        const instance = new caver.klay.Contract(tokenAbi);
        info.newInstance = await instance.deploy({data: tokenCode, arguments:[info.newInstanceBridge._address]})
            .send({ from: info.sender, gas: 100000000, value: 0 })
        info.token = info.newInstance._address
    } catch (e) {
        console.log("Error:", e)
    }
}

(async function TokenDeploy() {
    await deploy(conf.scn)
    await deploy(conf.en)
    // add minter
    await conf.scn.newInstance.methods.addMinter(conf.scn.bridge).send({ from: conf.scn.sender, to: conf.scn.bridge, gas: 100000000, value: 0 })
    await conf.en.newInstance.methods.addMinter(conf.en.bridge).send({ from: conf.en.sender, to: conf.en.bridge, gas: 100000000, value: 0 })

    await conf.en.newInstance.methods.registerBulk(conf.en.sender,1,10).send({from: conf.en.sender, gas: 10000000, value: 0})

    // register operator
    await conf.scn.newInstanceBridge.methods.registerOperator(conf.scn.operator).send({ from: conf.scn.sender, gas: 100000000, value: 0 })
    await conf.en.newInstanceBridge.methods.registerOperator(conf.en.operator).send({ from: conf.en.sender, gas: 100000000, value: 0 })

    // register token
    await conf.scn.newInstanceBridge.methods.registerToken(conf.scn.token, conf.en.token).send({ from: conf.scn.sender, gas: 100000000, value: 0 })
    await conf.en.newInstanceBridge.methods.registerToken(conf.en.token, conf.scn.token).send({ from: conf.en.sender, gas: 100000000, value: 0 })

    // transferOwnership
    await conf.scn.newInstanceBridge.methods.transferOwnership(conf.scn.operator).send({ from: conf.scn.sender, gas: 100000000, value: 0 })
    await conf.en.newInstanceBridge.methods.transferOwnership(conf.en.operator).send({ from: conf.en.sender, gas: 100000000, value: 0 })

    console.log(`subbridge.registerBridge("${conf.scn.bridge}", "${conf.en.bridge}")`)
    console.log(`subbridge.subscribeBridge("${conf.scn.bridge}", "${conf.en.bridge}")`)
    console.log(`subbridge.registerToken("${conf.scn.bridge}", "${conf.en.bridge}", "${conf.scn.token}", "${conf.en.token}")`)

    const filename  = "transfer_conf.json"
    fs.writeFile(filename, JSON.stringify(conf), (err) => {
        if (err) {
            console.log("Error:", err);
        }
    })
})();
