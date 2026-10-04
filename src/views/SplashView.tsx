import { Button } from "../components/ui/button";

export function SplashView({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500 min-h-[80vh]">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 font-serif text-primary">
        Immersive Language Learning
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Practice real-world conversations in different languages with an AI companion powered by Gemini Live API.
      </p>
      <Button size="lg" onClick={onNext} className="text-lg px-8 py-6">
        Start Journey
      </Button>
    </div>
  );
}
