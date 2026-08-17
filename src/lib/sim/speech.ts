type SpeechHandlers = {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
};

type Rec = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return !!getRecognitionCtor();
}

export function createListener(handlers: SpeechHandlers) {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return {
      supported: false,
      start: () => handlers.onError?.("This browser cannot hear you. Type a command instead."),
      stop: () => undefined,
    };
  }

  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = "en-US";
  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    const text = last?.[0]?.transcript?.trim();
    if (text) handlers.onResult(text);
  };
  rec.onerror = (event) => {
    if (event.error === "not-allowed") {
      handlers.onError?.("Microphone permission is blocked. You can still type.");
    }
  };

  return {
    supported: true,
    start: () => {
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}
