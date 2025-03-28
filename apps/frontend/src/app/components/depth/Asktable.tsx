export const AskTable = ({ asks }: { asks: [string, string][] }) => {
  let currentTotal = 0;
  const sortAsks = asks.slice(0, 15);
  const relevantAsks = sortAsks.sort((a, b) => Number(a[0]) - Number(b[0]));
  const asksWithTotalWithoutReverse: [string, string, number][] = relevantAsks.map(
    ([price, quantity]) => [
      price,
      quantity,
      (currentTotal += Number(quantity)),
    ],
  );
  const maxTotal = relevantAsks.reduce(
    (acc, [_, quantity]) => acc + Number(quantity),
    0,
  );
const asksWithTotal = asksWithTotalWithoutReverse.sort((a, b) => Number(b[0]) - Number(a[0]))
  return (
    <div>
      {asksWithTotal?.filter(([_, quantity]) => parseFloat(quantity) > 0)
      ?.map(([price, quantity, total]) => (
        <Ask
          maxTotal={maxTotal}
          key={price}
          price={price}
          quantity={quantity}
          total={total}
        />
      ))}
    </div>
  );
};
function Ask({
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
    <div className="relative flex w-full bg-transparent overflow-hidden py-1 px-2 mb-1">
      {/* Background Bar (Animating from right to left) */}
      <div
        className="absolute top-0 right-0 h-full bg-red-500/30 transition-all duration-300 ease-in-out rounded-md"
        style={{ width: `${(100 * total) / maxTotal}%` }}
      ></div>
  
      {/* Order Details */}
      <div className="flex justify-between w-full text-xs font-medium relative z-10">
        <div className="w-1/3 text-left text-red-500">{price}</div>
        <div className="w-1/3 text-center">{quantity}</div>
        <div className="w-1/3 text-right">{total?.toFixed(2)}</div>
      </div>
    </div>
  );
  
  
}
