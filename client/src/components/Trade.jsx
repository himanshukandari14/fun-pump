import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Trade({ toggleTrade, token, provider, factory }) {
  // Added 'function' keyword and fixed props destructuring
  const [target, setTarget] = useState(0);
  const [limit, setLimit] = useState(0);
  const [cost, setCost] = useState(0);

  async function buyHandler(event) {
    // Changed to use event instead of form
    event.preventDefault(); // Added to prevent form default submission
    const formData = new FormData(event.target);
    const amount = formData.get("amount");

    const cost = await factory.getCost(token.sold);
    const totalCost = cost * BigInt(amount);

    const signer = await provider.getSigner();

    const transaction = await factory
      .connect(signer)
      .buy(token.token, ethers.parseUnits(amount, 18), { value: totalCost });
    await transaction.wait();

    toggleTrade();
  }

  async function getSaleDetails() {
    const target = await factory.TARGET();
    setTarget(target);

    const limit = await factory.TOKEN_LIMIT();
    setLimit(limit);

    const cost = await factory.getCost(token.sold);
    setCost(cost);
  }

  useEffect(() => {
    getSaleDetails();
  }, []); // Consider adding factory to dependency array if needed

  return (
    <div className="trade">
      <h2>trade</h2>

      <div className="token__details">
        <p className="name">{token.name}</p>
        <p>
          creator:{" "}
          {token.creator.slice(0, 6) + "..." + token.creator.slice(38, 42)}
        </p>
        <img src={token.image} alt="Pepe" width={256} height={256} />
        <p>marketcap: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p>base cost: {ethers.formatUnits(cost, 18)} ETH</p>
      </div>

      {token.sold >= limit || token.raised >= target ? (
        <p className="disclaimer">target reached!</p>
      ) : (
        <form onSubmit={buyHandler}>
          {" "}
          {/* Changed action to onSubmit */}
          <input
            type="number"
            name="amount"
            min={1}
            max={10000}
            placeholder="1"
          />
          <input type="submit" value="[ buy ]" />
        </form>
      )}

      <button onClick={toggleTrade} className="btn--fancy">
        [ cancel ]
      </button>
    </div>
  );
}
