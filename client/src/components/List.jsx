// List.jsx
import { ethers } from "ethers";
import { useState } from "react";

function List({ toggleCreate, fee, factory, signer }) {
  // Accept signer instead of provider
  const [formData, setFormData] = useState({ name: "", ticker: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const listHandler = async (event) => {
    event.preventDefault();

    try {
      const { name, ticker } = formData;

      // No need to get signer or connect factory since it's already connected
      const transaction = await factory.create(name, ticker, {
        value: fee,
      });
      await transaction.wait();
      toggleCreate();

      alert("Token successfully listed!");
      toggleCreate(); // Close the form after successful listing
    } catch (error) {
      console.error("Error listing token:", error);
      alert("Failed to list token. Please try again.");
    }
  };

  return (
    <div className="list">
      <h2>List New Token</h2>

      <div className="list_description">
        <p>Fee: {`${ethers.formatUnits(fee, 18)} ETH`}</p>
      </div>

      <form onSubmit={listHandler}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ticker"
          placeholder="Ticker"
          value={formData.ticker}
          onChange={handleChange}
          required
        />
        <input type="submit" value="[ list ]" />
      </form>

      <button className="btn--fancy" onClick={toggleCreate}>
        Cancel
      </button>
    </div>
  );
}

export default List;
