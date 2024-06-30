/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Frame } from "@gptscript-ai/gptscript";
import renderEventMessage from "@/lib/renderEventMessage";

const storiesPath = "public/stories";

function StoryWriter() {
  const [story, setStory] = useState<string>("");
  const [pages, setPages] = useState<number>();
  const [progress, setProgress] = useState("");
  const [runStarted, setRunStarted] = useState<boolean>(false);
  const [runFinished, setRunFinished] = useState<boolean | null>(null);
  const [currentTool, setCurrentTool] = useState("");
  const [events, setEvents] = useState<Frame[]>([])

  const runScript = async () => {
    setRunStarted(true);
    setRunFinished(false);

    const response = await fetch("/api/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story, pages, path: storiesPath }),
    });

    if (response.ok || response.body) {
      //Handle streams from the API
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      //@ts-ignore
      handleStream(reader, decoder);
      console.log("Streaming started");
    } else {
      setRunFinished(true);
      setRunStarted(false);
      console.log("Failed to start streaming");
    }
  };

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; //breaks the inifinite loop

      //The decoder is used to decode ti Uint8Array into a string
      const chunk = decoder.decode(value, { stream: true });

      //We split the chunk into events by splitting it by the event: keyword
      const eventData = chunk
        .split("\n\n")
        .filter((line) => line.startsWith("event: "))
        .map((line) => line.replace(/^event: /, ""));

      //We parse the JSON data and update the state accordingly
      eventData.forEach(data => {
        try {
          const parsedData = JSON.parse(data);

          if(parsedData.type === "callProgress"){
            setProgress(parsedData.output[parsedData.output.length - 1].content)
            setCurrentTool(parsedData.tool?.description || "")
          } else if (parsedData.type === "callStart") {
            setCurrentTool(parsedData.tool?.description || "")
          } else if (parsedData.type === "runFinish") {
            setRunFinished(true)
            setRunStarted(false)
          } else {
            setEvents((prevEvents) => [...prevEvents, parsedData])
          }
        } catch (error) {
          console.error("Failed to parse JSON", error)
        }
      })
    }
  }

  return (
    <div className="flex flex-col container">
      <section className="flex-1 flex flex-col border border-purple-300 rounded-md p-10 space-y-2">
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className="flex-1 text-black"
          placeholder="Write a story about a robot and a human who become friends..."
        />

        <Select onValueChange={(value) => setPages(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="How many pages should the story be?" />
          </SelectTrigger>

          <SelectContent className="w-full">
            {Array.from({ length: 5 }, (_, i) => (
              <SelectItem value={String(i + 1)} key={i}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          disabled={!story || !pages || runStarted}
          onClick={() => runScript()}
          className="w-full"
        >
          Generate Story
        </Button>
      </section>

      <section className="flex-1 pb-5 mt-5">
        <div className="flex flex-col-reverse w-full space-y-2 bg-gray-800 rounded-md text-gray-200 font-mono p-10 h-96 overflow-y-auto">
          <div>
            {runFinished === null && (
              <>
                <p className="animate-pulse mr-5">
                  I'm waiting for you to Generate a story above...
                </p>
                <br />
              </>
            )}
            <span className="mr-5">{">>"}</span>
          </div>

          {/* Current Tool */}
          {currentTool && (
            <div className="py-1o">
              <span className="mr-5">{"-- [Current Tool] --"}</span>
              {currentTool}
            </div>
          )}

          {/* Render Events */}
          <div className="space-y-5">
            {
              events.map((event, index) => (
                <div key={index}>
                  <span className="mr-5">{">>"}</span>
                  {renderEventMessage(event)}
                </div>
              ))
            }
          </div>

          {runStarted && (
            <div>
              <span className="mr-5 animate-in">
                {"-- [AI SToryteller Has Started] --"}
              </span>
              <br />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default StoryWriter;
