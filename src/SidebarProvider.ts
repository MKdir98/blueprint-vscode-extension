import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { create } from "@ton-community/blueprint/dist/cli/create";
import { run } from "@ton-community/blueprint/dist/cli/run";
import { UIProvider } from "@ton-community/blueprint";

export class SidebarProvider implements vscode.WebviewViewProvider, UIProvider {
  _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "changeContent": {
          if (!data.value) {
            return;
          }
          webviewView.webview.postMessage({
            type: "update",
            value: data.value,
          });
          break;
        }
        case "createContract": {
          const tempArgv = process.argv;
          process.argv = [];
          await create(
            {
              _: ["create"],
            },
            this
          );
          process.argv = tempArgv;
          break;
        }
        case "runContract": {
          const tempArgv = process.argv;
          process.argv = [];
          await run(
            {
              _: ["run"],
            },
            this
          );
          process.argv = tempArgv;
          break;
        }
        case "openTestExplorer": {
          vscode.commands.executeCommand("workbench.view.extension.test");
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
        </script>
			</head>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  write(message: string): void {
    this._view!.webview.postMessage({ type: "updateContent", value: message });
  }

  async prompt(message: string): Promise<boolean> {
    this._view!.webview.postMessage({ type: "updateContent", value: message });
    return true;
  }

  async input(message: string): Promise<string> {
    const result = await vscode.window.showInputBox({
      title: message,
    });
    return result!.toString();
  }

  async choose<T>(
    message: string,
    choices: T[],
    display: (v: T) => string
  ): Promise<T> {
    const result = await vscode.window.showQuickPick(
      choices.map((c) => ({ label: display(c) })),
      {
        title: message,
      }
    );
    for (let choice of choices) {
      if (display(choice) === result!.label) {
        return choice;
      }
    }
    throw Error();
  }

  setActionPrompt(message: string): void {
    this._view!.webview.postMessage({
      type: "updateContent",
      value: message,
    });
  }

  clearActionPrompt(): void {
    this._view!.webview.postMessage({ type: "clearContent" });
  }

  close() {}
}
