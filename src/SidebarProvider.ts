import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { create } from "@ton/blueprint/dist/cli/create";
import { build } from "@ton/blueprint/dist/cli/build";
import { run } from "@ton/blueprint/dist/cli/run";
import { findCompiles } from "@ton/blueprint/dist/utils";
import { UIProvider } from "@ton/blueprint";
import * as path from 'path';

export class SidebarProvider implements vscode.WebviewViewProvider, UIProvider {
  _view?: vscode.WebviewView;
  _blueprintLog?: vscode.OutputChannel;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    this._blueprintLog = vscode.window.createOutputChannel("blueprint-log");

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "getContracts": {
          await this.updateContracts();
          break;
        }
        case "buildContract": {
          // await buildOne(data.value);
          const tempArgv = process.argv;
          process.argv = [];
          await build(
            {
              _: ["build", data.value],
            },
            this
          );
          process.argv = tempArgv;
          break;
        }
        case "deployContract": {
          const tempArgv = process.argv;
          process.argv = [];
          await run(
            {
              _: ["run", 'deploy' + data.value],
            },
            this
          );
          process.argv = tempArgv;
          break;
        }
        case "viewContract": {
          const fileName = data.value;
          const filePaths = ['.func', '.tact'].map((ext) =>
            path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'contracts', this.pascalToSnake(fileName) + ext)
          );
          for (const filePath of filePaths) {
            try {
              const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
              await vscode.window.showTextDocument(document);
              break;
            } catch (error) {
              console.error(`Error opening file ${filePath}:`, error);
            }
          }
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
          await this.updateContracts();
          break;
        }
        case "runContract": {
          try {
            const tempArgv = process.argv;
            process.argv = [];
            await run(
              {
                _: ["run"],
              },
              this
            );
            process.argv = tempArgv;
          } catch (ex) {
            console.error(ex);
          }
          break;
        }
        case "openTestExplorer": {
          vscode.commands.executeCommand("workbench.view.extension.test");
          break;
        }
      }
    });
  }

  private pascalToSnake(input: string): string {
    return input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private async updateContracts(): Promise<void> {
    var contracts = (await findCompiles()).map(function (file) {
      return file.name;
    });
    this._view?.webview.postMessage({
      type: 'updateContracts',
      value: contracts
    })
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/media/reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/media/vscode.css")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/media/style.css")
    );
    const styleFontAwesomeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/media/font-awesome.css")
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
				<link href="${styleUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <link href="${styleFontAwesomeUri}" rel="stylesheet">
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
    this._blueprintLog!.appendLine(message);
    this._blueprintLog!.show();
  }

  async prompt(message: string): Promise<boolean> {
    this._blueprintLog!.appendLine(message);
    this._blueprintLog!.show();
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
    this._blueprintLog!.appendLine(message);
    this._blueprintLog!.show();
  }

  clearActionPrompt(): void {
    // do nothing
  }

  close() { }
}
