import { useState } from "react";
import files from "./files";
import { MonacoEditor } from "./MonacoEditor";

type File = (typeof files)[number];

export const App = () => {
  const [activeFile, setActiveFile] = useState<File>(files[0]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div>
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file)}
            style={{
              backgroundColor: file === activeFile ? "lightblue" : "white",
            }}
          >
            {file.path}
          </button>
        ))}
      </div>
      <MonacoEditor file={activeFile} />
    </div>
  );
};
