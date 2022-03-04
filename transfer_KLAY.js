const Caver = require('caver-js')
const fs = require('fs')



const conf = JSON.parse(fs.readFileSync('transfer_conf.json', 'utf8'));
const bridgeAbi = JSON.parse(fs.readFileSync('build/Bridge.abi', 'utf8'));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

(async function TokenTransfer() {
    const scnCaver = new Caver(`http://${conf.scn.ip}:${conf.scn.port}`)
    const scnInstanceBridge = new scnCaver.klay.Contract(bridgeAbi, conf.scn.bridge)
    const enCaver = new Caver(`http://${conf.en.ip}:${conf.en.port}`)
    const enInstanceBridge = new enCaver.klay.Contract(bridgeAbi, conf.en.bridge)

    conf.scn.sender = scnCaver.klay.accounts.wallet.add(conf.scn.key).address
    conf.en.sender = enCaver.klay.accounts.wallet.add(conf.en.key).address
    const alice = "0xc40b6909eb7085590e1c26cb3becc25368e249e9"

    try {

        balance = await scnCaver.rpc.klay.getBalance(alice)
        console.log("alice balance:", balance)
        console.log(conf.en.sender)
        console.log(conf.en.bridge)
        console.log(await enCaver.rpc.klay.getBalance(conf.en.bridge))
        console.log(conf.scn.bridge)
        console.log(await scnCaver.rpc.klay.getBalance(conf.scn.bridge))

        // Transfer main chain to service chain
        console.log("requestKLAYTransfer.. from main chain to service chain")
        const amount = enCaver.utils.convertToPeb(10, 'KLAY')
        await enInstanceBridge.methods.requestKLAYTransfer(alice,100000,[]).send({ from: conf.en.sender,gas: 100000000, value: amount })
        await sleep(6000)

        // Check alice balance in Service Chain
        balance = await scnCaver.rpc.klay.getBalance(alice)
        console.log("alice balance:", balance)
    } catch (e) {
        console.log("Error:", e)
    }

})()
