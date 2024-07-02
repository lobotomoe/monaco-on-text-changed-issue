import { UserConfig } from "monaco-editor-wrapper";
import "vscode/localExtensionHost";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getEditorServiceOverride from "@codingame/monaco-vscode-editor-service-override";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import { whenReady as whenThemeReady } from "@codingame/monaco-vscode-theme-defaults-default-extension";
import { whenReady as whenPythonReady } from "@codingame/monaco-vscode-python-default-extension";
import { useOpenEditorStub } from "monaco-editor-wrapper/vscode/services";
import { ShowLightbulbIconMode } from "vscode/vscode/vs/editor/common/config/editorOptions";

export const EDITOR_THEME = "Default Dark Modern";

export const createUserConfig = (
  workspaceRoot: string,
  code: string,
  codeUri: string
): UserConfig => {
  return {
    id: "python-editor",
    wrapperConfig: {
      serviceConfig: {
        userServices: {
          ...getThemeServiceOverride(),
          ...getTextmateServiceOverride(),
          ...getEditorServiceOverride(useOpenEditorStub),
          ...getKeybindingsServiceOverride(),
        },
        debugLogging: true,
      },
      editorAppConfig: {
        $type: "extended",
        codeResources: {
          main: {
            text: code,
            uri: codeUri,
          },
        },
        editorOptions: {
          glyphMargin: true,
          lightbulb: {
            enabled: ShowLightbulbIconMode.On,
          },
          minimap: {
            enabled: false,
          },
          wordBasedSuggestions: "currentDocument",
          scrollBeyondLastLine: false,
          theme: EDITOR_THEME,
        },
        userConfiguration: {
          json: JSON.stringify({
            "workbench.colorTheme": EDITOR_THEME,
          }),
        },
        awaitExtensionReadiness: [whenThemeReady, whenPythonReady],
        useDiffEditor: false,
        overrideAutomaticLayout: true,
      },
    },
    loggerConfig: {
      enabled: true,
      debugEnabled: true,
    },
  };
};
