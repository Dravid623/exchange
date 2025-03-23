"use client";

import { useState } from "react";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { ExchangeAPI } from "../utils/exchangeApi";

export function SwapUI({ market }: { market: string }) {
  const exchange = new ExchangeAPI();
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"limit" | "market">("limit");
  const [balance,setBalance] = useState(0);
  const [marketPrice, setMarketPrice]=useState(0)

  const handleSubmit = async () => {
    try {
      await exchange.postOrder(market, price, quantity, activeTab, "1");
    } catch (error) {
      console.error("Failed to place order:", error);
    }
  };

  return (
    <Card>
      <div>
        {/* Buy/Sell Buttons */}
        <div className="flex h-[60px]">
          <TabButton label="Buy" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Sell" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Order Type Buttons */}
        <div className="flex gap-5 px-3 py-2">
          <OrderTypeButton label="Limit" type={type} setType={setType} />
          <OrderTypeButton label="Market" type={type} setType={setType} />
        </div>

        <div className="flex flex-col mb-2 px-3 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-baseTextMedEmphasis">Available Balance</span>
            <span className="font-medium text-baseTextHighEmphasis">
              36.94 INR
            </span>
          </div>

          <Input
            label="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <Input
            label="Quantity NSE"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {/* Submit Button */}
          <button
            type="button"
            className={`font-semibold focus:outline-none h-12 rounded-xl text-base px-4 py-2 my-4 ${
              activeTab === "buy"
                ? "bg-green-600 text-green"
                : "bg-red-600 text-red"
            }`}
            onClick={handleSubmit}
          >
            {activeTab === "buy" ? "Buy" : "Sell"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function TabButton({
  label,
  activeTab,
  setActiveTab,
}: {
  label: "Buy" | "Sell";
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<"buy" | "sell">>;
}) {
  const isActive = activeTab === label.toLowerCase();

  return (
    <div
      className={`flex-1 cursor-pointer justify-center border-b-2 p-4 ${
        isActive
          ? label === "Buy"
            ? "border-b-greenBorder bg-greenBackgroundTransparent"
            : "border-b-redBorder bg-redBackgroundTransparent"
          : "border-b-baseBorderMed hover:border-b-baseBorderFocus"
      }`}
      onClick={() => setActiveTab(label.toLowerCase() as "buy" | "sell")}
    >
      <p
        className={`text-center text-sm font-semibold ${
          label === "Buy" ? "text-greenText" : "text-redText"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function OrderTypeButton({
  label,
  type,
  setType,
}: {
  label: "Limit" | "Market";
  type: string;
  setType: React.Dispatch<React.SetStateAction<"limit" | "market">>;
}) {
  const isActive = type === label.toLowerCase();

  return (
    <div
      className={`flex cursor-pointer justify-center py-2 ${
        isActive
          ? "text-blue-600"
          : ""
      }`}
      onClick={() => setType(label.toLowerCase() as "limit" | "market")}
    >
      <div className="text-x font-medium py-1 border-b-2">
        {label}
      </div>
    </div>
  );
}
