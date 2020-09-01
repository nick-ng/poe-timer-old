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

export default function WhisperVoice({ event }) {
  const [maxWhisperVoiceAgeSeconds, setMaxWhisperVoiceAgeSeconds] = useState(
    parseInt(
      localStorage.getItem(MAX_WHISPER_VOICE_AGE_SECONDS_KEY) ||
        DEFAULT_MAX_WHISPER_VOICE_AGE_SECONDS,
      10
    )
  );
  const [voiceSettings, setVoiceSettings] = useState(
    JSON.parse(
      localStorage.getItem(VOICE_SETTINGS_KEY) ||
        JSON.stringify({
          volume: 0.5,
        })
    )
  );
  const [voiceList, setVoiceList] = useState([]);
  const [saying, setSaying] = useState("");

  useEffect(() => {
    function populateVoiceList() {
      const voices = synth.getVoices();
      if (voices && voices.length > 0) {
        setVoiceList(
          voices.map((voice) => ({
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
    const timestampThreshold = Date.now() - maxWhisperVoiceAgeSeconds * 1000;

    if (
      event?.type === "whisper" &&
      event?.data &&
      event?.timestamp > timestampThreshold
    ) {
      setSaying(event.data);
      const utterance = new SpeechSynthesisUtterance(event.data);
      utterance.volume = voiceSettings.volume;
      synth.speak(utterance);
    }
  }, [event]);

  useEffect(() => {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  return (
    <Container>
      <p>Voices:</p>
      <ul>
        {voiceList.map((voice) => (
          <li key={voice.display}>{voice.display}</li>
        ))}
      </ul>
    </Container>
  );
}
