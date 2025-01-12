const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect, assert } = require("chai")
const { ethers } = require("hardhat")

describe("Factory", function () {
    const FEE = ethers.parseUnits("0.01",18)
    // fetch accounts
    
    async function deployFactoryFixture(){ //this fixture code will run everytime a test performed
        // fetch contract
        const [deployer, creator, buyer] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("Factory")
        
        // deploy the contract to test
        const factory = await Factory.deploy(FEE);

        // create ttoken
        const transaction = await factory.connect(creator).create("Dapp uni", "DAPP", {value: FEE})
        await transaction.wait();

        //getthe token address
        const tokenAddress = await factory.tokens(0);
        const token = await ethers.getContractAt("Token", tokenAddress)

        return { factory, deployer, creator, token, buyer } 
    }

    async function buyTokenFixture(){
        const {factory, token, creator, buyer} = await deployFactoryFixture()

        const AMOUNT = ethers.parseUnits("10000",18)
        const COST = ethers.parseUnits("1", 18);


        const transaction = await factory.connect(buyer).buy( await token.getAddress(),AMOUNT, {value: COST})
        await transaction.wait()

        return {factory, token, buyer, creator}


    }



    describe("Deployment", function(){ //nested describe for more sepration and tidy understanding
        it("Should set the fee", async function () {
            const {factory} = await loadFixture(deployFactoryFixture)

            assert.equal(await factory.fee(),FEE)
        })


          it("Should set owner", async function () {
            const { factory, deployer } = await loadFixture(deployFactoryFixture);

            assert.equal(await factory.owner(), deployer.address);
          });

    })


    // for creating tokens
    describe("Create Token", function(){
    
        it("should set the owner of the token", async function () {
            const {factory, token} = await loadFixture(deployFactoryFixture)
          expect(await token.owner()).to.equal(await factory.getAddress());
        });

         it("should set the supply", async function () {
            const {factory, token} = await loadFixture(deployFactoryFixture)
        

            const totalSupply = ethers.parseUnits("1000000", 18)
          expect( await token.balanceOf(await factory.getAddress())).to.equal(totalSupply);
        });


        it("should update ETH balance", async function () {
          const { factory} = await loadFixture(deployFactoryFixture);

        const balance = await ethers.provider.getBalance(await factory.getAddress());

          expect(balance).to.equal(
            FEE
          );
        });

       
        it("should create the sale", async function () {
          const { factory, token, creator } = await loadFixture(deployFactoryFixture);

          const count = await factory.totalTokens()
          expect (count).to.equal(1)


        const sale = await factory.getTokenSale(0)
        console.log(sale)

         expect(sale.token).to.equal(await token.getAddress());
         expect(sale.creator).to.equal(creator.address);
         expect(sale.sold).to.equal(0);
         expect(sale.raised).to.equal(0);
         expect(sale.isOpen).to.equal(true);
         
        });
    
        
        })
    
    describe("Buying", function (){
        const AMOUNT = ethers.parseUnits("10000", 18);
        const COST = ethers.parseUnits("1", 18);
        
        // check contract recieve eth
        it("Should update eth balance ", async function() {
            const {factory} = await loadFixture(buyTokenFixture)

            const balance = await ethers.provider.getBalance(await factory.getAddress())

            expect(balance).to.equal(FEE + COST);
        })


        // check that buyer recieved tokens
         it("Should update token balances ", async function(){
             const {factory, buyer, token} = await loadFixture(buyTokenFixture)

             const balance = await token.balanceOf(buyer.address)

             expect(balance).to.equal(AMOUNT)

         })


          it("Should update token sale ", async function () {
            const { factory, token } = await loadFixture(
              buyTokenFixture
            );

            const sale = await factory.tokenToSale(await token.getAddress());
           
            expect(sale.sold).to.equal(AMOUNT)
            expect(sale.raised).to.equal(COST)
            expect (sale.isOpen).to.equal(true)
            
            
          });

          it("should increase base price", async function(){
             const { factory, token } = await loadFixture(buyTokenFixture);

              const sale = await factory.tokenToSale(await token.getAddress());
              const cost = await factory.getCost(sale.sold)

              expect(cost).to.equal(ethers.parseUnits("0.0002"));
          })


    })
    
    describe("Depositing", function (){
        const AMOUNT = ethers.parseUnits("10000", 18);
        const COST = ethers.parseUnits("2", 18);

        it("Sale should be closed and sucessfullydeposits", async function () {
           const { factory, token, creator, buyer } = await loadFixture(
             buyTokenFixture
           );

          //  buy tokens again to reach target
          const buyTx =await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, {value: COST})
          await buyTx.wait()

          const sale = await factory.tokenToSale(await token.getAddress())
          expect(sale.isOpen).to.equal(false)

          
      const depositTx = await factory
        .connect(creator)
        .deposit(await token.getAddress());
      await depositTx.wait();

      const balance = await token.balanceOf(creator.address);
      expect(balance).to.equal(ethers.parseUnits("980000", 18));
        })
    })


    describe("Withdrawing Fees", function () {
      it("Should update ETH balances", async function () {
        const { factory, deployer } = await loadFixture(deployFactoryFixture);

        const transaction = await factory.connect(deployer).withdraw(FEE);
        await transaction.wait();

        const balance = await ethers.provider.getBalance(
          await factory.getAddress()
        );

        expect(balance).to.equal(0);
      });
    });


})
