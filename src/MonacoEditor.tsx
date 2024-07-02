import * as vscode from "vscode";
import {
  MonacoEditorReactComp,
  TextChanges,
} from "@typefox/monaco-editor-react";

import { useWorkerFactory } from "monaco-editor-wrapper/workerFactory";
import { useCallback } from "react";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
  RegisteredMemoryFile,
} from "@codingame/monaco-vscode-files-service-override";
import { createUserConfig } from "./config";

type MonacoEditorProps = {
  file: {
    path: string;
    content: string;
  };
};

const WORKSPACE_PATH = "/workspace";
const buildQueryPath = (workspacePath: string, path: string) =>
  `${workspacePath}/${path}.py`;

// Reference: https://github.com/TypeFox/monaco-languageclient/blob/d80b0bc1e3a28c046057869fecccb3a9b2351346/packages/examples/src/python/client/reactPython.tsx#L18
useWorkerFactory({
  ignoreMapping: true,
  workerLoaders: {
    editorWorkerService: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/editor/editor.worker.js",
          import.meta.url
        ),
        { type: "module" }
      ),
  },
});

export const MonacoEditor = ({ file }: MonacoEditorProps) => {
  const queryPath = buildQueryPath(WORKSPACE_PATH, file.path);

  const fileUri = vscode.Uri.file(queryPath);
  const fileSystemProvider = new RegisteredFileSystemProvider(false);
  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(fileUri, file.content)
  );
  registerFileSystemOverlay(1, fileSystemProvider);

  const handleTextChange = useCallback((textChanges: TextChanges) => {
    console.log(
      `Dirty? ${textChanges.isDirty}\ntext: ${textChanges.main}\ntextOriginal: ${textChanges.original}`
    );
  }, []);

  const handleError = useCallback((e: unknown) => {
    console.error("MonacoEditor error:", e);
  }, []);

  const handleLoad = useCallback(
    (wrapper: MonacoEditorLanguageClientWrapper) => {
      console.log(
        `Monaco Editor Loaded ${wrapper.reportStatus().join("\n").toString()}`
      );
    },
    []
  );

  const userConfig = createUserConfig(WORKSPACE_PATH, file.content, queryPath);

  return (
    <div style={{ height: "100%" }}>
      <MonacoEditorReactComp
        userConfig={userConfig}
        onTextChanged={handleTextChange}
        onLoad={handleLoad}
        onError={handleError}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};
