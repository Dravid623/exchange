
import {
  CandlestickSeries,
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import { KlineForChart } from "./types";

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private lastUpdateTime: number = 0;
  private chart: IChartApi | null = null;
  private currentBar: {
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
  } = {
    open: null,
    high: null,
    low: null,
    close: null,
  };

  constructor(

    ref: HTMLDivElement | string,
    initialData:KlineForChart[],
    layout: { background: string; color: string },
  ) {
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      grid: {
        horzLines: {
          visible: true,
        },
        vertLines: {
          visible: false,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: "white",
      },
    });

    this.chart = chart;
    this.candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    this.candleSeries.setData(
      initialData
        .filter((data) => data.startTime) // it should be startTime. kline type.
        .map((data) => ({
          ...data,
          time: Math.floor(data.startTime / 1000) as UTCTimestamp,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
        }))
        .sort((a, b) => a.time - b.time)
    );
    this.chart.timeScale().fitContent();
  }

  public update(updatedPrice:KlineForChart) {
    // if (!this.lastUpdateTime) {
    //   this.lastUpdateTime = new Date().getTime();
    // }

    this.candleSeries.update({
      // time: (this.lastUpdateTime / 1000) as UTCTimestamp,
      time: Math.floor(updatedPrice.startTime / 1000) as UTCTimestamp,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    // if (updatedPrice.newCandleInitiated) {
    //   this.lastUpdateTime = updatedPrice.time;
    // }
  }
  public destroy() {
    this.chart?.remove();
  }
}
