import * as _vscode from "vscode";

declare global {
  const tsvscode: {
    onmessage: (event: any) => void;
    postMessage: ({ type: string, value: any }) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}
