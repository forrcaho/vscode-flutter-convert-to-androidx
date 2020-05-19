import * as vscode from 'vscode';
import ConvertToAndroidX from './ConvertToAndroidX';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.convert_to_androidx', convertToAndroidX);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getFlutterRoot(): string | undefined {
	if (vscode.workspace.workspaceFolders?.length === 1) {
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	} else if (vscode.window.activeTextEditor) {
		let workspaceFolder =
			vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
		return workspaceFolder?.uri.fsPath;
	}
}

function convertToAndroidX() {
	const flutterRoot = getFlutterRoot();
	if (flutterRoot === undefined) {
		vscode.window.showErrorMessage(
			"Could not find flutter project root.\n" +
			"If in a multi-root workspace, please open any file under\n" +
			"the flutter project and try again");
		return;
	}
	const converter = new ConvertToAndroidX(flutterRoot);
	try {
		converter.execute();
	} catch (err) {
		vscode.window.showErrorMessage(
			"Conversion to AndroidX failed:\n" + err
		);
		return;
	}
	vscode.window.showInformationMessage("Conversion to AndroidX succeeded!");
}