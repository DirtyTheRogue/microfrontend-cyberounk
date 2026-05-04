import React, { useEffect, useMemo, useState } from "react";
import eventBus from "shared/eventBus";
import "./BillboardMatrix.css";

export default function BillboardMatrix() {
  const [hackerCommand, setHackerCommand] = useState(null);
  const [powerOutage, setPowerOutage] = useState(null);
  const [riotIndex, setRiotIndex] = useState(0);
  const [glitchPulse, setGlitchPulse] = useState(false);

  const defaultPanels = [
    { text: "PIXEL COLA - TASTE THE FUTURE", color: "#940c16" },
    { text: "NEON BANK - YOUR CREDITS ARE SAFE", color: "#1f4ed8" },
    { text: "SYNTH WEAR - DRESS LIKE TOMORROW", color: "#5b2d9a" },
  ];

  const riotMessages = useMemo(
    () => ["REVOLUTION - MAINTENANT", "ILS NOUS MENTENT", "REJOIGNEZ-NOUS"],
    [],
  );

  const currentMessage = useMemo(() => {
    if (powerOutage === "total") return "TOTAL BLACKOUT - SYSTEM COMPROMISED";
    if (powerOutage === "partial") return "POWER FAILURE - ZONES OFFLINE";
    if (hackerCommand === "storm") return "STORM WARNING - EVACUATE NOW";
    if (hackerCommand === "riot") return riotMessages[riotIndex % riotMessages.length];
    if (hackerCommand === "love") return "LOVE IS THE ANSWER";
    return null;
  }, [hackerCommand, powerOutage, riotIndex, riotMessages]);

  const currentColor = useMemo(() => {
    if (hackerCommand === "storm") return "#ff8a1f";
    if (hackerCommand === "riot") return "#ff0033";
    if (hackerCommand === "love") return "#ff5aa5";
    if (powerOutage) return "#ff1f3d";
    return null;
  }, [hackerCommand, powerOutage]);

  useEffect(() => {
    const unsubHacker = eventBus.on("hacker:command", (payload) => {
      if (!payload || !payload.command) return;
      const { command } = payload;
      if (command === "reset") {
        setHackerCommand(null);
        setPowerOutage(null);
        setRiotIndex(0);
        return;
      }
      if (command === "riot") {
        setHackerCommand("riot");
        return;
      }
      if (command === "storm" || command === "love") {
        setHackerCommand(command);
      }
    });

    const unsubPower = eventBus.on("power:outage", (payload) => {
      if (!payload || !payload.severity) {
        setPowerOutage(null);
        return;
      }
      const { severity } = payload;
      if (severity === "total" || severity === "partial") {
        setPowerOutage(severity);
      } else {
        setPowerOutage(null);
      }
    });

    return () => {
      unsubHacker();
      unsubPower();
    };
  }, []);

  useEffect(() => {
    if (hackerCommand !== "riot") return;
    const interval = setInterval(() => {
      setRiotIndex((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [hackerCommand]);

  useEffect(() => {
    const isCrisis = Boolean(hackerCommand || powerOutage);
    const text = currentMessage || "BROADCAST NORMAL";
    const color = currentColor || "#940c16";
    eventBus.emit("billboard:message", {
      text,
      glitch: isCrisis,
      color,
    });
  }, [currentMessage, currentColor, hackerCommand, powerOutage]);

  useEffect(() => {
    if (!hackerCommand && !powerOutage) return;
    setGlitchPulse(true);
    const t = setTimeout(() => setGlitchPulse(false), 600);
    return () => clearTimeout(t);
  }, [hackerCommand, powerOutage]);

  const simulateRandomHacker = () => {
    const commands = ["storm", "riot", "love", "reset"];
    const random = commands[Math.floor(Math.random() * commands.length)];
    eventBus.emit("hacker:command", { command: random });
  };

  const simulateRandomPowerOutage = () => {
    const severities = ["partial", "total", null];
    const random = severities[Math.floor(Math.random() * severities.length)];
    if (random === null) {
      eventBus.emit("power:outage", { severity: null });
    } else {
      eventBus.emit("power:outage", {
        zones: ["ZONE-A", "ZONE-B"],
        severity: random,
        cityPower: random === "total" ? 0 : 45,
      });
    }
  };

  return (
    <div className="billboard-matrix">
      <div className="billboard-header">
        <span>BILLBOARD MATRIX</span>
        <span className={"glitch-badge" + (hackerCommand || powerOutage || glitchPulse ? " active" : "")}>
          {hackerCommand !== null ? "HACKING" : powerOutage !== null ? "POWER OUTAGE" : "BROADCAST"}
        </span>
      </div>

      <div className="button-group">
        <button className="simulate-btn" onClick={simulateRandomHacker}>
          SIMULATE HACK
        </button>
        <button className="simulate-btn" onClick={simulateRandomPowerOutage}>
          SIMULATE POWER OUTAGE
        </button>
      </div>

      <div className="panels">
        {defaultPanels.map((panel, index) => (
          <Panel
            key={panel.text}
            index={index}
            text={panel.text}
            crisisText={currentMessage}
            hackerCommand={hackerCommand}
            powerOutage={powerOutage}
            glitchPulse={glitchPulse}
            color={panel.color}
            crisisColor={currentColor}
          />
        ))}
      </div>
    </div>
  );
}

const Panel = ({
  index,
  text,
  crisisText,
  hackerCommand,
  powerOutage,
  glitchPulse,
  color,
  crisisColor,
}) => {
  const isCrisis = Boolean(hackerCommand || powerOutage);
  const isPartialOutage = powerOutage === "partial";
  const isTotalOutage = powerOutage === "total";
  const message = isCrisis && crisisText ? crisisText : text;
  const backgroundStyle = isCrisis
    ? { background: hackerCommand === "love" ? "linear-gradient(120deg, #ff76b8, #ff9a6b)" : crisisColor }
    : { background: color };

  return (
    <div
      className={
        "panel" +
        (isCrisis ? " crisis" : "") +
        (isCrisis ? " glitching" : "") +
        (glitchPulse ? " glitch-pulse" : "") +
        (isPartialOutage && index % 2 === 1 ? " blackout-partial" : "") +
        (isTotalOutage ? " blackout-total" : "")
      }
      style={backgroundStyle}
    >
      <div className="panel-text">{message}</div>
      <div className="panel-scanlines" />
    </div>
  );
};
