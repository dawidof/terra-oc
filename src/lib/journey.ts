export interface JourneyStage {
  /** 1-based order. */
  stage: number;
  key: string;
  label: string;
  description: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    stage: 1,
    key: "contract",
    label: "Договор и предоплата",
    description: "Спецификация и условия поставки подтверждены.",
  },
  {
    stage: 2,
    key: "supplier",
    label: "Подтверждение поставщика",
    description: "Автомобиль закреплён у поставщика.",
  },
  {
    stage: 3,
    key: "inspection",
    label: "Проверка автомобиля",
    description: "Автомобиль проверен перед выкупом.",
  },
  {
    stage: 4,
    key: "buyout",
    label: "Выкуп автомобиля",
    description: "Покупка у поставщика подтверждена.",
  },
  {
    stage: 5,
    key: "shipping",
    label: "Отправка",
    description: "Автомобиль отправлен в Ташкент.",
  },
  {
    stage: 6,
    key: "customs",
    label: "Оформление",
    description: "Таможенное оформление и сертификация.",
  },
  {
    stage: 7,
    key: "ready",
    label: "Готов к выдаче",
    description: "Автомобиль готов к передаче клиенту.",
  },
];

export const JOURNEY_TOTAL = JOURNEY_STAGES.length;

/**
 * Client journey stage suggested when a delivery/inventory status changes.
 * Used to offer the manager a one-click journey sync.
 */
export const SUGGESTED_STAGE_BY_VEHICLE_STATUS: Record<string, number> = {
  reserved: 2,
  in_transit: 5,
  on_order: 6,
  sold: 7,
};

export function getJourneyStage(stage: number): JourneyStage {
  const clamped = Math.min(Math.max(stage, 1), JOURNEY_TOTAL);
  return JOURNEY_STAGES[clamped - 1];
}

export interface JourneyStepView {
  stage: number;
  key: string;
  label: string;
  description: string;
  state: "complete" | "current" | "future";
  confirmedAt: string | null;
}

export function buildJourneySteps(
  currentStage: number,
  confirmedAtByStage: Record<number, string> = {}
): JourneyStepView[] {
  return JOURNEY_STAGES.map((s) => ({
    stage: s.stage,
    key: s.key,
    label: s.label,
    description: s.description,
    state:
      s.stage < currentStage
        ? "complete"
        : s.stage === currentStage
          ? "current"
          : "future",
    confirmedAt: confirmedAtByStage[s.stage] || null,
  }));
}
