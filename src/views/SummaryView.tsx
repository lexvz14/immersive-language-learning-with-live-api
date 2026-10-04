import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";

export function SummaryView({ result, onRestart }: { result: any, onRestart: () => void }) {
  const isSuccess = result?.success;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in duration-500 min-h-[80vh]">
      <Card className="w-full max-w-lg border-2 border-primary">
        <CardHeader className="text-center">
            <div className="text-6xl mb-4">{isSuccess ? "🎉" : "💪"}</div>
            <CardTitle className="text-3xl">
                {isSuccess ? "Mission Accomplished!" : "Good Try!"}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg text-center whitespace-pre-wrap">
                {result?.summary || "No summary provided."}
            </p>
        </CardContent>
        <CardFooter className="flex justify-center mt-4">
            <Button size="lg" onClick={onRestart}>Try Another Mission</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
