const Caver = require('caver-js')
const fs = require('fs')

const conf = JSON.parse(fs.readFileSync('transfer_conf.json', 'utf8'));
const bridgeAbi = JSON.parse(fs.readFileSync('build/Bridge.abi', 'utf8'));
const tokenAbi = JSON.parse(fs.readFileSync('build/ServiceChainToken.abi', 'utf8'));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

(async function TokenTransfer() {
    const scnCaver = new Caver(`http://${conf.scn.ip}:${conf.scn.port}`)
    const scnInstance = new scnCaver.klay.Contract(tokenAbi, conf.scn.token)
    const scnInstanceBridge = new scnCaver.klay.Contract(bridgeAbi, conf.scn.bridge)

    const enCaver = new Caver(`http://${conf.en.ip}:${conf.en.port}`)
    const enInstance = new enCaver.klay.Contract(tokenAbi, conf.en.token)
    const enInstanceBridge = new enCaver.klay.Contract(bridgeAbi, conf.en.bridge)

	conf.scn.sender = scnCaver.klay.accounts.wallet.add(conf.scn.key).address
	conf.en.sender = enCaver.klay.accounts.wallet.add(conf.en.key).address
    const alice = "0xc40b6909eb7085590e1c26cb3becc25368e249e9"

    try {
        // Transfer main chain to service chain
        console.log("requestValueTransfer.. from main chain to service chain")
        await enInstance.methods.requestValueTransfer(100, alice, 0, []).send({from:conf.en.sender, to: conf.en.token, gas: 1000000})
        await sleep(6000)

        // Check alice balance in Service Chain
        balance = await scnInstance.methods.balanceOf(alice).call()
        console.log("alice balance:", balance)
    } catch (e) {
        console.log("Error:", e)
    }

})()
