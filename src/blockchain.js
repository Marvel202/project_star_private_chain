/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
        console.log(this.chain)
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
            console.log(this)
        } 
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
                try {
                block.height = self.height+1;
                console.log("block height",block.height)
                block.time = new Date().getTime().toString().slice(0,-3);
                      // previous block hash
                if(self.height!==-1){
                    block.previousBlockHash = self.chain[self.height].hash;
                
                      // Block hash with SHA256 using newBlock and converting to a string
                    block.hash = SHA256(JSON.stringify(block)).toString();
                       // Adding block object to chain    
                
                    let isValidBlocks = await self.validateChain();
                    if(isValidBlocks) {
                        self.chain.push(block);
                        self.height += 1;
                            } resolve(block)
                        }
                else {
                    self.height += 1;
                    block.hash = SHA256(JSON.stringify(block)).toString();
                    self.chain.push(block);
                    self.height = 0;
                }
                  resolve(block)
                        } catch(err) {
                            reject(err)
                        }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */


    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`)
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let time = parseInt(message.split(":")[1])
            let currentTime = parseInt(new Date().getTime().toString().slice(0,-3));
            const timeLapsed = currentTime - time > 300       
            let verified = bitcoinMessage.verify(message, address, signature);
            if(timeLapsed) reject(Error("time lapsed!"))
        
          
            if (!timeLapsed && verified) {
                let block = new BlockClass.Block({"owner":address,"star":star})
                resolve(self._addBlock(block))} 
                
                else {reject (
                    new Error('verification failed!')
                    )}
        }).catch(err => {
            console.log('ERROR: error due to', err.message)
        })
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            
           const findBlock = self.chain.find( block => block.hash === hash)

           if (!findBlock) reject(`no block find with ${hash} provided`)
           resolve(findBlock)
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let findblock = self.chain.filter(block => block.height === height)[0];
            console.log("findblock", findblock)
            if(findblock){
                resolve(findblock);
            } else {
                resolve(`can't find block with ${height} provided`);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
        const data = self.chain.forEach( (block) => block.getData().then(data => {
            if (data.owner===address) stars.push(data)
                })
                )
                resolve(stars)
            })
        }; 
    

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            for (let n in self.chain) {
                if (n >= 1) {
                console.log("n now", n)
                const currentBlock = self.chain[n]
                console.log("currBlock",currentBlock)
                if (!currentBlock.validate()) errorLog.push({
                    error:`this block #${self.chain[n].height} failed validation `,
                    block: currentBlock
                })
                let testprevHash = self.chain[n-1].hash;
                if (testprevHash !== currentBlock.previousBlockHash) {
                    errorLog.push({
                        error: `the previous block #${n-1} has been tampered`,
                        block: currentBlock
                    })
                }
            } if (n === 0 ) continue; 
            } resolve(errorLog)
        });
        if (errorLog > 0) {
            alert("Block errors in total" + errorLog.length + errorLog)
            
        } 
    }

    // validateChain() {
    //     let self = this;
    //     let errorLog = [];
    //     return new Promise(async (resolve, reject) => {

    //         self.chain.forEach(async(block) => {
    //             if(block.height === 0 ) {
    //                 await block ? true : errorLog.at("failed to build Genesis block")
    //             } 
    //             else if( block.previousBlockHash === self.chain[block.height - 1].hash){
    //                 await block.validate() ? true : errorLog.push(new Error("invalid block"))
    //             } 
    //         })
    //         resolve(errorLog)
    //     })
    // }

}
    

module.exports.Blockchain = Blockchain;   