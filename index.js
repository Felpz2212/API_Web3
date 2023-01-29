const { request, response } = require('express');
const express = require('express');
var bodyParser = require('body-parser');
const Web3 = require('web3');
const app = express();
const abiPancake = require('./ABIPancake.json');
const abiToken = require('./ABIERC20.json');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('/', (request, response) => {
    var web3 = new Web3(Web3.givenProvider);
    try {
        var wallet = web3.eth.accounts.wallet.create(1);
        //console.log(wallet);
        // wallet = JSON.parse(`{Address: ${wallet[0].address}, Pk: ${wallet[0].privateKey}}`)
        response.json({
            address: wallet[0].address,
            privateKey: wallet[0].privateKey
        })

    } catch (err) {
        console.log(err.name);
        console.log(err.message);

        response.status('400').json('Recuperação de carteira falhou');
    }
});

app.post('/swap', (request, response) => {
    var web3 = new Web3('https://rpc.ankr.com/bsc');
    // console.log(request.body);

    // console.log(request.body)
    // console.log(request.query.private_key);

    async function teste() {
        try {
            var wallet = web3.eth.accounts.wallet.add(request.body.private_key);

            console.log(wallet);

            var contractPancake = new web3.eth.Contract(abiPancake, `0x10ED43C718714eb63d5aA57B78B54704E256024E`);

            console.log(wallet.address);
            // console.log(contractPancake);


            var contractToken = new web3.eth.Contract(abiToken, `${request.body.contractAddress}`);
            var contractToken2 = new web3.eth.Contract(abiToken, `${request.body.tkfinal}`);

            var AmountIn = request.body.amountin;
            var amountin = web3.utils.toWei(AmountIn);
            var amount = web3.utils.toBN(amountin);

            console.log(amount);

            var AmountOutMin = await contractPancake.methods.getAmountsOut(amountin, [request.body.contractAddress, request.body.tkfinal]).call();

            var TokenInicial = request.body.contractAddress;
            var TokenFinal = request.body.tkfinal;
            // var walletAddress = request.body.walletAddress;

            // console.log(request.body);
            console.log(Date.now());

            console.log(AmountOutMin[1]);
            console.log(web3.utils.toWei(AmountIn));

            //AmountIn, AmountOutMin, Path[], To, deadline
            console.log(request.body);
            console.log(await contractToken.methods.name().call());
            // console.log(await contractToken.methods.approve('0x10ED43C718714eb63d5aA57B78B54704E256024E', web3.utils.toWei('50000000', 'ether')).send({ from: wallet.address, gas: '100000' }))
            console.log(await contractToken.methods.approve('0x10ED43C718714eb63d5aA57B78B54704E256024E', web3.utils.toWei('50000000', 'ether')).send({ from: wallet.address, gas: '100000' }))
            console.log(await contractToken2.methods.approve('0x10ED43C718714eb63d5aA57B78B54704E256024E', web3.utils.toWei('50000000', 'ether')).send({ from: wallet.address, gas: '100000' }))
            // console.log(await contractToken2.methods.approve('0x10ED43C718714eb63d5aA57B78B54704E256024E', web3.utils.toWei('50000000', 'ether')).send({ from: wallet.address, gas: '100000' }))

            console.log(await contractPancake.methods.swapExactTokensForTokens(web3.utils.toWei(AmountIn).toString(),
                AmountOutMin[1].toString(),
                [TokenInicial, TokenFinal],
                wallet.address,
                Date.now() + 100000000000).send({ from: wallet.address, gas: '200000' }))

            // await contractPancake.methods.swapExactTokensForTokens(web3.utils.toWei(AmountIn).toString(),
            //     AmountOutMin[1].toString(),
            //     [TokenInicial, TokenFinal],
            //     wallet.address,
            //     Date.now() + 100000000000).send({ from: wallet.address, gas: '200000' })
            // console.log(await contractToken2.methods.transfer(walletAddress, AmountOutMin[1].toString()).send({ from: wallet.address, gas: '200000' }));
            
            console.log(`Valor out: ${AmountIn} + Valor in: ${web3.utils.fromWei(AmountOutMin[1])}`)
            
            response.json({
                valor_out: AmountIn,
                valor_in: web3.utils.fromWei(AmountOutMin[1]),
                status: "completo"
            });

        } catch (err) {
            response.status(400).json({
                error: 400,
                message: `Swap falhou: ${err.message}`
            })
        }
    }

    teste();
});

app.post('/send', (request, response) => {
    var web3 = new Web3('https://rpc.ankr.com/bsc');
    var wallet = web3.eth.accounts.wallet.add(request.body.private_key);
    var to = request.body.to;
    var valor = web3.utils.toWei(request.body.amount).toString();


    async function send() {
        try {
            console.log(await web3.eth.sendTransaction({ from: wallet.address, to: to, value: valor, gas: '200000' }));
            response.json({
                status: "completo"
            });
        } catch (err) {
            response.status(400).json({
                error: 400,
                message: "Transferencia falhou"
            })
        }
    }

    send();

})

app.post('/transfer', (request, response) => {
    var web3 = new Web3('https://rpc.ankr.com/bsc');
    async function transfer() {
        try {
            var wallet = web3.eth.accounts.wallet.add(request.body.private_key);
            var contract = new web3.eth.Contract(abiToken, `${request.body.contractAddress}`);

            var walletAddress = request.body.walletAddress;
            var AmountIn = request.body.amount;
            var amountin = web3.utils.toWei(AmountIn);
            var amount = web3.utils.toBN(amountin);

            console.log(amount);
            // console.log(wallet.address);
            // var balance = await contract.methods.balanceOf(wallet.address).call();
            // // console.log(balance);
            // balance = web3.utils.toBN(balance.toString());
            console.log(await contract.methods.transfer(walletAddress, amount).send({ from: wallet.address, gas: '200000' }))
            response.json({
                status: "completo"
            });
        } catch (err) {
            response.status(400).json({
                error: 400,
                message: "Transfêrencia de tokens falhou" + ` ${err.message}`
            })
        }
    }

    transfer();

});

app.post('/transferAllTokens',(request, response) => {
    var web3 = new Web3('https://rpc.ankr.com/bsc');
    async function transfer() {
        try {
            var wallet = web3.eth.accounts.wallet.add(request.body.private_key);
            var contract = new web3.eth.Contract(abiToken, `${request.body.contractAddress}`);

            var walletAddress = request.body.walletAddress;
            // var AmountIn = request.body.amount;
            // var amountin = web3.utils.toWei(AmountIn);
            // var amount = web3.utils.toBN(amountin);

            // console.log(amount);
            console.log(wallet.address);
            var balance = await contract.methods.balanceOf(wallet.address).call();
            balance = web3.utils.toBN(balance.toString());
            console.log(await contract.methods.transfer(walletAddress, balance).send({ from: wallet.address, gas: '200000' }))
            response.json({
                status: "completo"
            });
        } catch (err) {
            response.status(400).json({
                error: 400,
                message: "Transfêrencia de tokens falhou" + ` ${err.message}`
            })
        }
    }

    transfer();

})

app.post('/balance', (request, response) => {

    async function getBalance(){
        try{
            
            var web3 = new Web3('https://rpc.ankr.com/bsc');
            var address = request.body.walletAddress;
            const balance = await web3.eth.getBalance(address);

            console.log(balance);

            response.status(200).json({
                status: '200',
                balance: web3.utils.fromWei(balance)
            })


        }catch(err){
            response.status(400).json({
                status: '400',
                error: `Não foi possível recuperar o balance da conta: ${err.message}`
            })
        }
    }

    getBalance();
})


app.listen(8080, () => {
    console.log('servidor inciado!');
})