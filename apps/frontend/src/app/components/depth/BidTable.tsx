export const BidTable = ({ bids }: { bids: [string, string][] }) => {
  let currentTotal = 0;
  const reverseSortBids = bids.slice(0, 15);
  const relevantBids = reverseSortBids.sort((a, b) => Number(b[0]) - Number(a[0]));
  const bidsWithTotal: [string, string, number][] = relevantBids.map(
    ([price, quantity]) => [
      price,
      quantity,
      (currentTotal += Number(quantity)),
    ],
  );
  const maxTotal = relevantBids.reduce(
    (acc, [, quantity]) => acc + Number(quantity),
    0,
  );

  return (
    <div>
      {bidsWithTotal?.filter(([, quantity]) => parseFloat(quantity) > 0)
      ?.map(([price, quantity, total]) => (
        <Bid
          maxTotal={maxTotal}
          total={total}
          key={price}
          price={price}
          quantity={quantity}
        />
      ))}
    </div>
  );
};

function Bid({
  price,
  quantity,
  total,
  maxTotal,
}: {
  price: string;
  quantity: string;
  total: number;
  maxTotal: number;
}) {
  return (
    <div className="relative flex w-full bg-transparent overflow-hidden py-1 px-2 mt-1">
      <div
        className="absolute top-0 right-0 h-full bg-green-300 transition-all duration-300 ease-in-out rounded-md"
        style={{ width: `${(100 * total) / maxTotal}%` }}
      >
        <div
        className="absolute top-0 right-0 h-full bg-green-500 transition-all duration-300 ease-in-out rounded-md"
        style={{ width: `${(100 * Number(quantity)) / maxTotal}%` }}
      ></div>
      </div>
      <div className="flex justify-between w-full text-xs font-medium relative z-10">
        <div className="w-1/3 text-left text-green-500">{price}</div>
        <div className="w-1/3 text-center">{quantity}</div>
        <div className="w-1/3 text-right">{total?.toFixed(2)}</div>
      </div>
    </div>
  );
  
  
}
