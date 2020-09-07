import React, { useEffect, useState } from "react";
import styled from "styled-components";

const MAX_WHISPER_VOICE_AGE_SECONDS_KEY = "POE_MAX_WHISPER_VOICE_AGE_SECONDS";
const VOICE_SETTINGS_KEY = "POE_VOICE_SETTINGS_KEY";
const DEFAULT_MAX_WHISPER_VOICE_AGE_SECONDS = 30;

const Container = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  max-height: 200px;
  max-width: 30vw;
  overflow-y: scroll;
  padding: 0.5em;
  border-top: 1px solid grey;
  border-left: 1px solid grey;
  background-color: white;
`;

const synth = window.speechSynthesis;

const getDefaults = () => {
  const defaultWhisperAge = parseInt(
    localStorage.getItem(MAX_WHISPER_VOICE_AGE_SECONDS_KEY) ||
      DEFAULT_MAX_WHISPER_VOICE_AGE_SECONDS,
    10
  );

  const defaultSettings = JSON.parse(
    localStorage.getItem(VOICE_SETTINGS_KEY) ||
      JSON.stringify({
        volume: 0.5,
      })
  );

  return {
    defaultWhisperAge,
    defaultSettings,
  };
};

export default function WhisperVoice({ event }) {
  const { defaultWhisperAge, defaultSettings } = getDefaults();
  const [maxWhisperAge, setMaxWhisperAge] = useState(defaultWhisperAge);
  const [settings, setSettings] = useState(defaultSettings);
  const [voiceList, setVoiceList] = useState([]);
  const [phrase, setPhrase] = useState(null);
  const [saying, setSaying] = useState("");

  const updateSettings = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const getVoice = (voiceURI) =>
    synth.getVoices().find((voice) => voice.voiceURI === voiceURI);

  useEffect(() => {
    function populateVoiceList() {
      const voices = synth.getVoices();
      if (voices && voices.length > 0) {
        setVoiceList(
          voices
            .filter((a) => a.lang.startsWith("en"))
            .map((voice) => ({
              voice,
              display: `${voice.name} (${voice.lang})`,
            }))
        );
      }
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, []);

  useEffect(() => {
    const timestampThreshold = Date.now() - maxWhisperAge * 1000;

    if (
      event?.type === "whisper" &&
      event?.data &&
      event?.timestamp > timestampThreshold
    ) {
      setPhrase(event.data);
    }
  }, [event]);

  useEffect(() => {
    if (phrase) {
      setSaying(phrase);
      const voice = getVoice(settings.voiceURI);
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.volume = settings.volume;
      if (voice) {
        utterance.voice = voice;
      }
      synth.speak(utterance);
    }
  }, [phrase]);

  useEffect(() => {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <Container>
      <div>
        <label>
          Trades only:
          <input type="checkbox" />
        </label>
      </div>
      <div>
        <select
          value={settings.voiceURI}
          onChange={(e) => {
            updateSettings("voiceURI", e.target.value);
          }}
        >
          {voiceList.map((voice) => (
            <option key={voice.voice.voiceURI} value={voice.voice.voiceURI}>
              {voice.display}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setPhrase(`Hello, this is ${settings.voiceURI}`);
            setTimeout(() => {
              setPhrase(null);
            }, 100);
          }}
        >
          Test
        </button>
      </div>
    </Container>
  );
}
