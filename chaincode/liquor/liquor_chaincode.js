
// peer chaincode invoke -C myc1 -n marbles -c '{"Args":["initLiquor","101","old monk","750","20","delhi"]}'


const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
    async Init(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);
        console.info('=========== Instantiated Liquor Chaincode ===========');
        return shim.success();
    }

    async Invoke(stub) {
        console.info('Transaction ID: ' + stub.getTxID());
        console.info(util.format('Args: %j', stub.getArgs()));

        let ret = stub.getFunctionAndParameters();
        console.info(ret);

        let method = this[ret.fcn];
        if (!method) {
            console.log('no function of name:' + ret.fcn + ' found');
            throw new Error('Received unknown function ' + ret.fcn + ' invocation');
        }
        try {
            let payload = await method(stub, ret.params, this);
            return shim.success(payload);
        } catch (err) {
            console.log(err);
            return shim.error(err);
        }
    }

    // ===============================================
    // initLiquor - create a new liquor
    // ===============================================
    async initLiquor(stub, args, thisClass) {
        if (args.length != 5) {
            throw new Error('Incorrect number of arguments. Expecting 5');
        }
        // ==== Input sanitation ====
        console.info('--- start init marble ---')
        if (args[0].length <= 0) {
            console.log('1st argument must be a non-empty string')
            throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
            console.log('2nd argument must be a non-empty string')
            throw new Error('2nd argument must be a non-empty string');
        }
        if (args[2].length <= 0) {
            console.log('3rd argument must be a non-empty string')
            throw new Error('3rd argument must be a non-empty string');
        }
        if (args[3].length <= 0) {
            console.log('4th argument must be a non-empty string')
            throw new Error('4th argument must be a non-empty string');
        }
        if (args[4].length <= 0) {
            console.log('5th argument must be a non-empty string')
            throw new Error('5th argument must be a non-empty string');
        }

        let batchId = args[0].toLowerCase();
        let brand = args[1].toLowerCase();
        let price = parseInt(args[2]);
        if (typeof price !== 'number') {
            console.log('3rd argument must be a numeric string')
            throw new Error('3rd argument must be a numeric string');
        }
        let qty = args[3].toLowerCase();
        let state = args[4].toLowerCase();

        // ==== Check if liquor already exists ====
        let liquorState = await stub.getState(batchId);
        if (liquorState.toString()) {
            console.log('This liquor already exists: ' + liquorState)
            throw new Error('This liquor already exists: ' + liquorState);
        }

        try{
            // ==== Create liquor object and marshal to JSON ====
        let liquor = {};
        liquor.docType = 'liquor';
        liquor.batchId = batchId;
        liquor.brand = brand;
        liquor.price = price;
        liquor.qty = qty;
        liquor.state = state;
        console.log('payload state: ', liquor)
        // === Save liqour to state ===
        await stub.putState(batchId, Buffer.from(JSON.stringify(liquor)));
        console.log('payload saved successfully')
        let indexName = 'batchId~brand';
        let batchIdBrandIndexKey = await stub.createCompositeKey(indexName, [liquor.batchId, liquor.brand]);
        console.log(batchIdBrandIndexKey);

        await stub.putState(batchIdBrandIndexKey, Buffer.from('\u0000'));
        console.log('payload indexed successfully')
        // ==== Liquor saved and indexed. Return success ====
        console.info('- end init liquor');
        }catch(err){
            console.log('Error occured at initLiquor.  ', err)
        }
        
    }

    // ===============================================
    // readMarble - read a liquor from chaincode state
    // ===============================================
    async readLiquor(stub, args, thisClass) {
        if (args.length != 1) {
            throw new Error('Incorrect number of arguments. Expecting name of the batchId to query');
        }
        let batchId = args[0];
        if (!batchId) {
            throw new Error(' liquor batchId must not be empty');
        }
        let liquorAsbytes = await stub.getState(batchId); //get the marble from chaincode state
        if (!liquorAsbytes.toString()) {
            let jsonResp = {};
            jsonResp.Error = 'Error occured at readLiquor. Liquor does not exist: ' + batchId;
            throw new Error(JSON.stringify(jsonResp));
        }
        console.info('=======================================');
        console.log(liquorAsbytes.toString());
        console.info('=======================================');
        return liquorAsbytes;
    }
}

shim.start(new Chaincode());