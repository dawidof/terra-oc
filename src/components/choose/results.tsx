import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./result-card";
import { RotateCcw, Send } from "lucide-react";

interface Recommendation {
  trimId: string;
  trimName: string;
  modelName: string;
  brandName: string;
  trimSlug: string;
  bodyType: string | null;
  powertrainType: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  estimatedTotalUsd: string | null;
  score: number;
  reasons: string[];
}

interface ResultsProps {
  recommendations: Recommendation[];
  onReset: () => void;
  onLeadForm: () => void;
}

export function Results({ recommendations, onReset, onLeadForm }: ResultsProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ваши варианты</h2>
          <p className="text-muted-foreground">
            Найдено {recommendations.length} {recommendations.length === 1 ? "вариант" : "вариантов"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Начать заново
          </Button>
          <Button onClick={onLeadForm}>
            <Send className="mr-1 h-4 w-4" />
            Оставить заявку
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <ResultCard key={rec.trimId} rec={rec} onLeadForm={onLeadForm} />
        ))}
      </div>

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              К сожалению, подходящих вариантов не найдено.
            </p>
            <Button variant="outline" onClick={onReset} className="mt-4">
              <RotateCcw className="mr-1 h-4 w-4" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
