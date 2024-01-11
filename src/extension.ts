// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
process.chdir(vscode.workspace.workspaceFolders![0].uri.path);
import { SidebarProvider } from "./SidebarProvider.js";
require('ts-node/register');

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const jestExtension = vscode.extensions.getExtension('Orta.vscode-jest');

  if (!jestExtension) {
    vscode.window.showInformationMessage('Extension "vscode-jest" is not installed. Installing...');
    vscode.commands.executeCommand("workbench.extensions.installExtension", "Orta.vscode-jest").then(() => {
      vscode.window.showInformationMessage('Extension "vscode-jest" has been installed.');
    });
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "blueprint-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("blueprint.refresh", async () => {
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.blueprint-sidebar-view"
      );
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }
