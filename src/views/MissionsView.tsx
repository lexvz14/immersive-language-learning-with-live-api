import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import missionsData from "../data/missions.json";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";

export function MissionsView({ onSelect }: { onSelect: (mission: any, language: string, fromLanguage: string, mode: string) => void }) {
  const [selectedLanguage, setSelectedLanguage] = useState("es-ES");
  const [selectedFromLanguage, setSelectedFromLanguage] = useState("en-US");
  const [mode, setMode] = useState("teacher");
  const [customTitle, setCustomTitle] = useState("");
  const [customObjective, setCustomObjective] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState("Medium");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Include 24 common languages
  const languages = [
    { code: 'ar-SA', name: '🇸🇦 Arabic' },
    { code: 'bn-BD', name: '🇧🇩 Bengali' },
    { code: 'bg-BG', name: '🇧🇬 Bulgarian' },
    { code: 'zh-CN', name: '🇨🇳 Chinese' },
    { code: 'hr-HR', name: '🇭🇷 Croatian' },
    { code: 'cs-CZ', name: '🇨🇿 Czech' },
    { code: 'da-DK', name: '🇩🇰 Danish' },
    { code: 'nl-NL', name: '🇳🇱 Dutch' },
    { code: 'en-US', name: '🇺🇸 English' },
    { code: 'en-GB', name: '🇬🇧 English (UK)' },
    { code: 'fi-FI', name: '🇫🇮 Finnish' },
    { code: 'fr-FR', name: '🇫🇷 French' },
    { code: 'de-DE', name: '🇩🇪 German' },
    { code: 'el-GR', name: '🇬🇷 Greek' },
    { code: 'iw-IL', name: '🇮🇱 Hebrew' },
    { code: 'hi-IN', name: '🇮🇳 Hindi' },
    { code: 'hu-HU', name: '🇭🇺 Hungarian' },
    { code: 'id-ID', name: '🇮🇩 Indonesian' },
    { code: 'it-IT', name: '🇮🇹 Italian' },
    { code: 'ja-JP', name: '🇯🇵 Japanese' },
    { code: 'ko-KR', name: '🇰🇷 Korean' },
    { code: 'no-NO', name: '🇳🇴 Norwegian' },
    { code: 'pl-PL', name: '🇵🇱 Polish' },
    { code: 'pt-PT', name: '🇵🇹 Portuguese' },
    { code: 'pt-BR', name: '🇧🇷 Portuguese (BR)' },
    { code: 'ro-RO', name: '🇷🇴 Romanian' },
    { code: 'ru-RU', name: '🇷🇺 Russian' },
    { code: 'sr-RS', name: '🇷🇸 Serbian' },
    { code: 'sk-SK', name: '🇸🇰 Slovak' },
    { code: 'sl-SI', name: '🇸🇮 Slovenian' },
    { code: 'es-ES', name: '🇪🇸 Spanish' },
    { code: 'sw-KE', name: '🇰🇪 Swahili' },
    { code: 'sv-SE', name: '🇸🇪 Swedish' },
    { code: 'th-TH', name: '🇹🇭 Thai' },
    { code: 'tr-TR', name: '🇹🇷 Turkish' },
    { code: 'uk-UA', name: '🇺🇦 Ukrainian' },
    { code: 'vi-VN', name: '🇻🇳 Vietnamese' }
  ];

  const handleCustomSubmit = () => {
    if (customTitle && customObjective) {
        onSelect({
            id: "custom",
            emoji: "✨",
            title: customTitle,
            objective: customObjective,
            difficulty: customDifficulty,
            systemPrompt: `The user has defined a custom scenario: ${customObjective}. You must follow their instructions strictly.`
        }, selectedLanguage, selectedFromLanguage, mode);
        setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Native Language</h2>
            <div className="flex gap-2 flex-wrap h-32 overflow-y-auto border border-border p-2 rounded-md">
            {languages.map((lang) => (
                <Button
                key={lang.code}
                variant={selectedFromLanguage === lang.code ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFromLanguage(lang.code)}
                >
                {lang.name}
                </Button>
            ))}
            </div>
        </div>

        <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Target Language</h2>
            <div className="flex gap-2 flex-wrap h-32 overflow-y-auto border border-border p-2 rounded-md">
            {languages.map((lang) => (
                <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLanguage(lang.code)}
                >
                {lang.name}
                </Button>
            ))}
            </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 bg-muted p-1 rounded-lg w-full md:w-auto">
             <Button className="flex-1" variant={mode === 'teacher' ? 'default' : 'ghost'} onClick={() => setMode('teacher')}>Teacher Mode</Button>
             <Button className="flex-1" variant={mode === 'roleplay' ? 'default' : 'ghost'} onClick={() => setMode('roleplay')}>Immersive Roleplay</Button>
          </div>
          <p className="text-muted-foreground text-sm flex-1 text-right max-w-md hidden md:block">
              {mode === 'teacher' ? "The AI will help you by translating and speaking in both languages if you get stuck." : "The AI will stay in character and only speak in the target language."}
          </p>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">Choose your Mission</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">+ Create Custom</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Mission</DialogTitle>
                  <DialogDescription>
                    Define your own roleplay scenario and difficulty.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="title" className="text-right text-sm font-medium">Title</label>
                    <Input id="title" value={customTitle} onChange={(e: any) => setCustomTitle(e.target.value)} placeholder="e.g. Job Interview" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="objective" className="text-right text-sm font-medium">Objective</label>
                    <Input id="objective" value={customObjective} onChange={(e: any) => setCustomObjective(e.target.value)} placeholder="Describe the scenario..." className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Difficulty</label>
                    <Select value={customDifficulty} onValueChange={setCustomDifficulty}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCustomSubmit} disabled={!customTitle || !customObjective}>Start Mission</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {missionsData.map((mission: any) => (
              <Card key={mission.id} className="flex flex-col cursor-pointer hover:border-primary transition-colors" onClick={() => onSelect(mission, selectedLanguage, selectedFromLanguage, mode)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mission.emoji}</span>
                    {mission.title}
                  </CardTitle>
                  <CardDescription>
                    <span className="inline-block px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs mb-2">
                      {mission.difficulty}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{mission.objective}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
