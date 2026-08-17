"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMAND_HINTS } from "@/lib/sim/commands";
import { createListener, speechSupported } from "@/lib/sim/speech";
import { sounds } from "@/lib/sim/sounds";
import { useSim } from "@/lib/sim/store";

export function CommandBar() {
  const [text, setText] = useState("");
  const issueCommand = useSim((s) => s.issueCommand);
  const lastCommand = useSim((s) => s.lastCommand);
  const listening = useSim((s) => s.listening);
  const speechError = useSim((s) => s.speechError);
  const setListening = useSim((s) => s.setListening);
  const setSpeechError = useSim((s) => s.setSpeechError);
  const muted = useSim((s) => s.muted);
  const toggleMute = useSim((s) => s.toggleMute);
  const listener = useRef<ReturnType<typeof createListener> | null>(null);

  useEffect(() => {
    listener.current = createListener({
      onResult: (spoken) => {
        setText(spoken);
        issueCommand(spoken);
        setListening(false);
      },
      onError: (msg) => {
        setSpeechError(msg);
        setListening(false);
      },
    });
  }, [issueCommand, setListening, setSpeechError]);

  const submit = () => {
    void sounds.unlock();
    if (!text.trim()) return;
    issueCommand(text);
    setText("");
  };

  return (
    <div className="pointer-events-auto w-full rounded-2xl bg-black/40 p-2 text-white shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Type: come, play, dinner, scoop…"
          className="h-11 bg-white/95 text-base text-foreground"
          enterKeyHint="send"
        />
        <Button type="button" size="lg" className="h-11 px-4" onClick={submit}>
          Say it
        </Button>
        <Button
          type="button"
          size="lg"
          variant={listening ? "default" : "secondary"}
          className="h-11 w-11"
          aria-label="Voice command"
          onClick={() => {
            void sounds.unlock();
            if (!speechSupported()) {
              setSpeechError("This iPad browser may not hear you. Type instead.");
              return;
            }
            if (listening) {
              listener.current?.stop();
              setListening(false);
            } else {
              setSpeechError(null);
              setListening(true);
              listener.current?.start();
            }
          }}
        >
          <Mic className={listening ? "text-primary-foreground" : ""} />
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-11 w-11"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={toggleMute}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COMMAND_HINTS.map((hint) => (
          <Button
            key={hint}
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 px-3"
            onClick={() => {
              void sounds.unlock();
              issueCommand(hint);
            }}
          >
            {hint}
          </Button>
        ))}
      </div>
      {lastCommand ? (
        <p className="mt-2 text-sm">
          You: “{lastCommand.text}” —{" "}
          <span className={lastCommand.obeyed ? "text-emerald-200" : "text-amber-200"}>
            {lastCommand.obeyed ? "she listened" : "she ignored it"}
          </span>
          . {lastCommand.reason}
        </p>
      ) : (
        <p className="mt-2 text-sm text-white/70">Ask once. If she ignores you, meet a need first.</p>
      )}
      {speechError ? <p className="mt-1 text-sm text-destructive">{speechError}</p> : null}
      {listening ? <p className="mt-1 text-sm font-medium">Listening…</p> : null}
    </div>
  );
}
