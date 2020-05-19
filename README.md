# vscode-flutter-convert-to-androidx README

This extension fixes Flutter projects which give this error when you try to run them:

`
[!] Your app isn't using AndroidX.
    To avoid potential build failures, you can quickly migrate your app by following the steps on https://goo.gl/CP92wY.
`

The migration instructions provided in the error message involve using Android Studio, which is a pain for
VSCode users. Even when I tried that method, I didn't get it to work (although that was probably some dumb
error on my part).

I found some hackish instructions on how to edit the config files in the Flutter project's `android` subdirectory to use AndroidX at 
https://medium.com/@gabrc52/how-to-migrate-your-flutter-app-to-androidx-1202ad43c8c8 ,
and this extension is a hackish implmentation of those instructions.

Although I wrote it to roll back partial changes if it detects an error, I would still advise you to make sure
you can get your project back to a pristine state. (Since you probably got the Flutter project you're trying to
run off of GitHub, that shouldn't be a problem, though, right?)

## Features

This extension implements one command, "Convert Flutter Project to AndroidX", accessible from the Command Palette.

Open the project that needs to be converted. The root of the Flutter project must be the root of your VSCode
workspace for this extension to work. If you have a multi-root workspace, you can open any file in the Flutter
project so the extension will find the correct files.

Next, open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and search for 'androidx' to find the command "Convert Flutter Project to AndroidX".

You will see an informational message on success, or an error message if something went wrong.
