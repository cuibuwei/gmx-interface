import { LAST_BAR_REFRESH_INTERVAL } from "config/tradingview";
import { getLimitChartPricesFromStats, timezoneOffset } from "domain/prices";
import { CHART_PERIODS } from "lib/legacy";
import { Bar } from "./types";
import { formatTimeInBarToMs, getCurrentCandleTime, getMax, getMin } from "./utils";
import { fillBarGaps, getStableCoinPrice, getTokenChartPrice } from "./requests";
import { PeriodParams } from "charting_library";

const initialState = {
  chartToken: {
    price: 0,
    ticker: "",
    isChartReady: false,
  },
  lastBar: null,
  currentBar: null,
  startTime: 0,
  lastTicker: "",
  lastPeriod: "",
  barsInfo: {
    period: "",
    data: [],
    ticker: "",
  },
};

export class TVDataProvider {
  chartToken: {
    price: number;
    ticker: string;
    isChartReady: boolean;
  };
  lastBar: Bar | null;
  currentBar: Bar | null;
  startTime: number;
  lastTicker: string;
  lastPeriod: string;
  getCurrentPrice: (symbol: string) => number | undefined;
  supportedResolutions: { [key: number]: string };
  barsInfo: {
    period: string;
    data: Bar[];
    ticker: string;
  };

  constructor({ resolutions }) {
    const { lastBar, currentBar, startTime, lastTicker, lastPeriod, barsInfo: initialHistoryBarsInfo } = initialState;
    this.lastBar = lastBar;
    this.currentBar = currentBar;
    this.startTime = startTime;
    this.lastTicker = lastTicker;
    this.lastPeriod = lastPeriod;
    this.barsInfo = initialHistoryBarsInfo;
    this.supportedResolutions = resolutions;
  }

  async getLimitBars(chainId: number, ticker: string, period: string, limit: number): Promise<Bar[]> {
    const prices = await getLimitChartPricesFromStats(chainId, ticker, period, limit);
    return prices;
  }

  async getTokenLastBars(chainId: number, ticker: string, period: string, limit: number): Promise<Bar[]> {
    return this.getLimitBars(chainId, ticker, period, limit);
  }

  async getTokenChartPrice(chainId: number, ticker: string, period: string): Promise<Bar[]> {
    return getTokenChartPrice(chainId, ticker, period);
  }

  async getTokenHistoryBars(
    chainId: number,
    ticker: string,
    period: string,
    periodParams: PeriodParams
  ): Promise<Bar[]> {
    const barsInfo = this.barsInfo;
    if (!barsInfo.data.length || barsInfo.ticker !== ticker || barsInfo.period !== period) {
      try {
        const bars = await this.getTokenChartPrice(chainId, ticker, period);
        const filledBars = fillBarGaps(bars, CHART_PERIODS[period]);
        const currentCandleTime = getCurrentCandleTime(period);
        const lastBar = bars[bars.length - 1];
        if (lastBar.time === currentCandleTime) {
          this.lastBar = { ...lastBar, ticker, period };
        }
        this.barsInfo.data = filledBars;
        this.barsInfo.ticker = ticker;
        this.barsInfo.period = period;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.barsInfo = initialState.barsInfo;
      }
    }

    const { from, to, countBack } = periodParams;
    const toWithOffset = to + timezoneOffset;
    const fromWithOffset = from + timezoneOffset;

    const bars = barsInfo.data.filter((bar) => bar.time > fromWithOffset && bar.time <= toWithOffset);

    // if no bars returned, return empty array
    if (!bars.length) {
      return [];
    }

    // if bars are fewer than countBack, return all of them
    if (bars.length < countBack) {
      return bars;
    }

    // if bars are more than countBack, return latest bars
    return bars.slice(bars.length - countBack, bars.length);
  }

  async getBars(chainId: number, ticker: string, resolution: string, isStable: boolean, periodParams: PeriodParams) {
    const period = this.supportedResolutions[resolution];
    const { from, to } = periodParams;

    try {
      const bars = isStable
        ? getStableCoinPrice(period, from, to)
        : await this.getTokenHistoryBars(chainId, ticker, period, periodParams);

      return bars.map(formatTimeInBarToMs);
    } catch {
      throw new Error("Failed to get history bars");
    }
  }

  async getMissingBars(chainId: number, ticker: string, period: string, from: number) {
    if (!ticker || !period || !chainId || !from) return;
    const periodSeconds = CHART_PERIODS[period];
    const currentPeriod = getCurrentCandleTime(period);
    const barsCount = Math.ceil((currentPeriod - from) / periodSeconds) + 1;

    if (from === currentPeriod) return;
    if (barsCount > 0) {
      const bars = await this.getLimitBars(chainId, ticker, period, barsCount);
      if (bars && ticker === this.barsInfo.ticker && period === this.barsInfo.period) {
        this.lastBar = bars[bars.length - 1];
        this.currentBar = null;
      }
      return bars.filter((bar) => bar.time >= from).sort((a, b) => a.time - b.time);
    }
  }

  async getLastBar(chainId: number, ticker: string, period: string) {
    if (!ticker || !period || !chainId) {
      throw new Error("Invalid input. Ticker, period, and chainId are required parameters.");
    }
    const currentTime = Date.now();
    if (
      currentTime - this.startTime > LAST_BAR_REFRESH_INTERVAL ||
      this.lastTicker !== ticker ||
      this.lastPeriod !== period ||
      this.lastBar?.ticker !== ticker ||
      this.lastBar?.period !== period
    ) {
      const prices = await this.getTokenLastBars(chainId, ticker, period, 1);
      const currentPrice = this.chartToken.ticker === this.barsInfo.ticker && this.chartToken.price;

      if (prices?.length && currentPrice) {
        const lastBar = prices[0];
        const currentCandleTime = getCurrentCandleTime(period);
        const lastCandleTime = currentCandleTime - CHART_PERIODS[period];

        if (!this.lastBar) {
          this.lastBar = lastBar;
        }

        if (lastBar.time === currentCandleTime) {
          this.lastBar = { ...lastBar, close: currentPrice, ticker, period };
          this.startTime = currentTime;
          this.lastTicker = ticker;
          this.lastPeriod = period;
        }
        if (this.lastBar && lastBar.time === lastCandleTime) {
          this.lastBar = {
            open: this.lastBar.close,
            high: this.lastBar.close,
            low: this.lastBar.close,
            time: currentCandleTime,
            close: currentPrice,
            ticker,
            period,
          };
        }
      }
    }
    return this.lastBar;
  }

  async getLiveBar(chainId: number, ticker: string, period: string) {
    if (!ticker || !period || !chainId) return;

    const currentCandleTime = getCurrentCandleTime(period);
    try {
      this.lastBar = await this.getLastBar(chainId, ticker, period);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    const currentPrice = this.chartToken.ticker === this.barsInfo.ticker && this.chartToken.price;

    if (
      !this.chartToken.isChartReady ||
      !this.lastBar?.time ||
      !currentPrice ||
      this.barsInfo.ticker !== this.lastBar.ticker ||
      ticker !== this.barsInfo.ticker
    ) {
      return;
    }

    if (this.currentBar?.ticker !== this.barsInfo.ticker || this.currentBar?.period !== this.barsInfo.period) {
      this.currentBar = null;
    }

    if (currentCandleTime === this.lastBar.time) {
      this.currentBar = {
        ...this.lastBar,
        close: currentPrice,
        high: getMax(this.lastBar.open, this.lastBar.high, currentPrice, this.currentBar?.high),
        low: getMin(this.lastBar.open, this.lastBar.low, currentPrice, this.currentBar?.low),
        ticker,
        period,
      };
    } else {
      const { close } = this.currentBar ? this.currentBar : this.lastBar;
      const newBar = {
        time: currentCandleTime,
        open: close,
        close: currentPrice,
        high: getMax(close, currentPrice),
        low: getMin(close, currentPrice),
        ticker,
        period,
      };
      this.lastBar = newBar;
      this.currentBar = newBar;
    }
    return this.currentBar;
  }
  setCurrentChartToken(chartToken: { price: number; ticker: string; isChartReady: boolean }) {
    this.chartToken = chartToken;
  }
  get resolutions() {
    return this.supportedResolutions;
  }
  get currentPeriod() {
    return this.barsInfo.period;
  }
  get currentTicker() {
    return this.barsInfo.ticker;
  }
  resetState() {
    this.lastBar = initialState.lastBar;
    this.currentBar = initialState.currentBar;
    this.lastTicker = initialState.lastTicker;
    this.lastPeriod = initialState.lastPeriod;
    this.startTime = initialState.startTime;
    this.barsInfo = initialState.barsInfo;
  }
}
