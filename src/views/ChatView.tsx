import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { GeminiLiveAPI, MultimodalLiveResponseType } from "../lib/gemini-live/geminilive.js";
import { AudioStreamer, AudioPlayer } from "../lib/gemini-live/mediaUtils.js";
import { AudioVisualizer } from "../components/AudioVisualizer";

// TODO: Replace with real ReCaptcha logic or environment variable for testing
const RECAPTCHA_SITE_KEY = "6LeSYx8sAAAAAGdRAp8VQ2K9I-KYGWBykzayvQ8n";

export function ChatView({ mission, language, fromLanguage, mode, onComplete }: { mission: any, language: string, fromLanguage: string, mode: string, onComplete: (result: any) => void }) {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  const clientRef = useRef<any>(null);
  const audioStreamerRef = useRef<any>(null);
  const audioPlayerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiVisualizerRef = useRef<any>(null);
  const userVisualizerRef = useRef<any>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const initGemini = async () => {
      setLoading(true);
      try {
        const client = new GeminiLiveAPI();
        clientRef.current = client;

        let systemPrompt = `You are an AI language tutor assisting a user in learning ${language}. `;
        if (mode === 'teacher') {
            systemPrompt += `You must speak in ${language}, but you can explain things in the user's native language (${fromLanguage}) if they struggle or ask for help. `;
        } else {
             systemPrompt += `You must ONLY speak in ${language}. Never break character or speak another language. `;
        }
        systemPrompt += `The user's mission is: ${mission.objective}. ${mission.systemPrompt || ''}`;

        client.setSystemInstructions(systemPrompt);
        client.setVoice("Puck");
        client.setInputAudioTranscription(true);
        client.setOutputAudioTranscription(true);
        client.setEnableFunctionCalls(true);

        client.addFunction({
            name: "end_mission",
            description: "Call this function when the user has completed their objective or the conversation has naturally concluded.",
            parameters: {
                type: "object",
                properties: {
                    summary: {
                        type: "string",
                        description: "A summary of the conversation and the user's performance."
                    },
                    success: {
                        type: "boolean",
                        description: "Whether the user successfully completed the objective."
                    }
                }
            },
            requiredParameters: ["summary", "success"],
            runFunction: (params: any) => {
                onComplete(params);
            }
        });

        audioStreamerRef.current = new AudioStreamer(client);
        audioPlayerRef.current = new AudioPlayer();
        await audioPlayerRef.current.init();

        // Connect the AI output to the visualizer
        if (audioPlayerRef.current.audioContext && audioPlayerRef.current.workletNode) {
             aiVisualizerRef.current?.connect(audioPlayerRef.current.audioContext, audioPlayerRef.current.workletNode);
        }

        client.onReceiveResponse = (message: any) => {
            if (message.type === MultimodalLiveResponseType.AUDIO) {
                audioPlayerRef.current.play(message.data);
            } else if (message.type === MultimodalLiveResponseType.INPUT_TRANSCRIPTION) {
                 if (message.data.finished) {
                    setMessages(prev => [...prev, { role: "user", text: message.data.text }]);
                 }
            } else if (message.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
                 if (message.data.finished) {
                    setMessages(prev => [...prev, { role: "ai", text: message.data.text }]);
                 }
            } else if (message.type === MultimodalLiveResponseType.TOOL_CALL) {
                const funcCall = message.data.functionCalls[0];
                if (funcCall && funcCall.name === "end_mission") {
                     client.callFunction(funcCall.name, funcCall.args);
                }
            }
        };

        client.onConnectionStarted = async () => {
            setIsConnected(true);
            await audioStreamerRef.current.start();

            // Connect the user input (microphone) to the visualizer
            if (audioStreamerRef.current.audioContext && audioStreamerRef.current.source) {
               userVisualizerRef.current?.connect(audioStreamerRef.current.audioContext, audioStreamerRef.current.source);
            }

            setLoading(false);
        };

        client.onClose = () => {
            setIsConnected(false);
        };

        client.onErrorMessage = (msg: string) => {
            console.error("Gemini Error:", msg);
            alert("Error connecting to AI: " + msg);
            setLoading(false);
        };

        // Real integration needs grecaptcha
        if (window.grecaptcha && window.grecaptcha.enterprise) {
             window.grecaptcha.enterprise.ready(async () => {
                 try {
                     const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {action: 'chat'});
                     await client.connect(token);
                 } catch (e) {
                     console.error("Connection failed", e);
                     alert("Error starting chat. Please try again.");
                     onComplete({ summary: "Connection error.", success: false });
                 }
             });
        } else {
             // Fallback for dev if recaptcha is missing
             try {
                 await client.connect("dev-token");
             } catch (e) {
                 console.error("Dev connection failed", e);
                 alert("Dev connection failed.");
                 onComplete({ summary: "Connection error.", success: false });
             }
        }

      } catch (e) {
        console.error("Setup failed", e);
        setLoading(false);
        alert("Failed to initialize session.");
        onComplete({ summary: "Setup error.", success: false });
      }
    };

    initGemini();

    return () => {
      if (audioStreamerRef.current) audioStreamerRef.current.stop();
      if (audioPlayerRef.current) audioPlayerRef.current.destroy();
      if (clientRef.current) clientRef.current.disconnect();
      if (aiVisualizerRef.current) aiVisualizerRef.current.disconnect();
      if (userVisualizerRef.current) userVisualizerRef.current.disconnect();
    };
  }, [mission, language, fromLanguage, mode]);

  const toggleMic = () => {
      if (isMicMuted) {
          audioStreamerRef.current.start();
      } else {
          audioStreamerRef.current.stop();
      }
      setIsMicMuted(!isMicMuted);
  };

  const endEarly = () => {
      onComplete({ summary: "Mission ended early by user.", success: false });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto p-4 gap-4 animate-in fade-in duration-500">
      <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">{mission.emoji}</span>
                {mission.title}
            </h2>
            <p className="text-sm text-muted-foreground">{mission.objective}</p>
         </div>
         <div className="flex gap-2 items-center">
             <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${loading ? 'animate-pulse bg-yellow-500' : ''}`} title={isConnected ? "Connected" : "Disconnected"}></div>
         </div>
      </div>

      <div className="flex gap-4 h-48">
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden relative flex flex-col items-center">
              <div className="absolute top-2 left-2 text-xs text-muted-foreground font-semibold">User</div>
              <AudioVisualizer ref={userVisualizerRef} className={isMicMuted ? "opacity-50" : ""} />
              {isMicMuted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <p className="text-destructive font-bold">Muted</p>
                  </div>
              )}
          </div>
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden relative flex flex-col items-center">
              <div className="absolute top-2 left-2 text-xs text-muted-foreground font-semibold">AI</div>
              <AudioVisualizer ref={aiVisualizerRef} />
              {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                     <p className="text-muted-foreground animate-pulse">Connecting...</p>
                 </div>
              )}
          </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col gap-4 pb-4">
            {messages.length === 0 && !loading && (
                <p className="text-center text-muted-foreground italic mt-4">Start speaking in {language}!</p>
            )}
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
        </div>
      </ScrollArea>

      <div className="flex justify-center gap-4 py-2">
          <Button variant={isMicMuted ? "destructive" : "default"} size="lg" onClick={toggleMic} disabled={loading || !isConnected}>
              {isMicMuted ? "Unmute Mic" : "Mute Mic"}
          </Button>
          <Button variant="outline" size="lg" onClick={endEarly}>
              End Early
          </Button>
      </div>
    </div>
  );
}
