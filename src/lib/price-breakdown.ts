import { formatUsd } from "@/lib/format";

export { formatUsd };

export interface ConfiguratorPriceBreakdown {
  vehiclePrice: number;
  optionsDelta: number;
  logisticsCost: number | null;
  customsCost: number | null;
  serviceFee: number | null;
  total: number;
  hasUnpricedOptions: boolean;
}

interface BuildBreakdownInput {
  basePrice: number;
  estimatedTotalUsd: string | null;
  logisticsCost: number | null;
  customsCost: number | null;
  serviceFee: number | null;
  optionsDelta: number;
  hasUnpricedOptions: boolean;
}

export function buildConfiguratorBreakdown(
  input: BuildBreakdownInput
): ConfiguratorPriceBreakdown {
  const estimatedBase = input.estimatedTotalUsd
    ? Number(input.estimatedTotalUsd)
    : input.basePrice + 9000;

  return {
    vehiclePrice: input.basePrice,
    optionsDelta: input.optionsDelta,
    logisticsCost: input.logisticsCost,
    customsCost: input.customsCost,
    serviceFee: input.serviceFee,
    total: estimatedBase + input.optionsDelta,
    hasUnpricedOptions: input.hasUnpricedOptions,
  };
}
