const Caver = require('caver-js');
const fs = require('fs')

const conf = JSON.parse(fs.readFileSync('deploy_conf.json', 'utf8'));
const bridgeAbi = JSON.parse(fs.readFileSync('build/Bridge.abi', 'utf8'));
const bridgeCode = fs.readFileSync('build/Bridge.bin', 'utf8');


async function deploy_bridge(info) {

    const caver = new Caver(`http://${info.ip}:${info.port}`);
    info.sender = caver.klay.accounts.wallet.add(info.key).address

    try {
        // Deploy bridge
        const instanceBridge = new caver.klay.Contract(bridgeAbi);
        info.newInstanceBridge = await instanceBridge.deploy({data: bridgeCode, arguments:[true]})
            .send({ from: info.sender, gas: 100000000, value: 0 })
        info.bridge = info.newInstanceBridge._address

    } catch (e) {
        console.log("Error:", e)
    }
}

(async function TokenDeploy() {
    await deploy_bridge(conf.scn)
    await deploy_bridge(conf.en)

    // register operator
    await conf.scn.newInstanceBridge.methods.registerOperator(conf.scn.operator).send({ from: conf.scn.sender, gas: 100000000, value: 0 })
    await conf.en.newInstanceBridge.methods.registerOperator(conf.en.operator).send({ from: conf.en.sender, gas: 100000000, value: 0 })

    // transferOwnership
    await conf.scn.newInstanceBridge.methods.transferOwnership(conf.scn.operator).send({ from: conf.scn.sender, gas: 100000000, value: 0 })
    await conf.en.newInstanceBridge.methods.transferOwnership(conf.en.operator).send({ from: conf.en.sender, gas: 100000000, value: 0 })

    console.log(`subbridge.registerBridge("${conf.scn.bridge}", "${conf.en.bridge}")`)
    console.log(`subbridge.subscribeBridge("${conf.scn.bridge}", "${conf.en.bridge}")`)

    const filename  = "transfer_conf.json"
    fs.writeFile(filename, JSON.stringify(conf), (err) => {
        if (err) {
            console.log("Error:", err);
        }
    })
})();
