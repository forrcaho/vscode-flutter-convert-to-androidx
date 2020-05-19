'use strict';

import * as fs from 'fs';
import * as path from 'path';

class DocFix {

    inFilePath: string;
    lines: string[];
    newContents = "";
    cursor = 0;

    constructor(inFilePath: string) {
        this.inFilePath = inFilePath;
        this.lines = fs.readFileSync(inFilePath, {encoding: 'utf-8'}).split("\n");
        // trailing newline in file generates spurious empty line
        if (this.lines[this.lines.length - 1] === '') {
            this.lines.length--;
        }
    }

    backup() {
        fs.copyFileSync(this.inFilePath, this.inFilePath + ".ORIG");
    }

    get currentLine() {
        return this.lines[this.cursor];
    }

    advanceTo(regex: RegExp) {
        while (this.cursor < this.lines.length && ! regex.test(this.lines[this.cursor])) {
            this.newContents += this.lines[this.cursor] + "\n";
            this.cursor++;
        }
        if (this.cursor === this.lines.length) {
            throw new Error("Did not find expected line");
        }
    }

    editCurrentLine(regex: RegExp, replacement: string) {
        const line = this.lines[this.cursor];
        this.newContents += line.replace(regex, replacement) + "\n";
        this.cursor++;
    }

    finish() {
        while (this.cursor < this.lines.length) {
            this.newContents += this.lines[this.cursor] + "\n";
            this.cursor++;
        }
    }

    appendLine(line: string) {
        if (! /\n$/s.test(line)) {
            line += "\n";
        }
        this.newContents += line;
    }

    write() {
        fs.writeFileSync(this.inFilePath, this.newContents);
    }
}


export default class ConvertToAndroidX {

    basePath: string;
    appBuildGradlePath: string;
    gradleWrapperPropertiesPath: string;
    buildGradlePath: string;
    gradlePropertiesPath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
        this.appBuildGradlePath = path.join(basePath, "android/app/build.gradle");
        this.gradleWrapperPropertiesPath = 
            path.join(basePath, "android/gradle/wrapper/gradle-wrapper.properties");
        this.buildGradlePath = path.join(basePath, "android/build.gradle");
        this.gradlePropertiesPath = path.join(basePath, "android/gradle.properties");
    }

    confirmFileExists(path: string) {
        try {
            fs.accessSync(path, fs.constants.W_OK);
        } catch {
            throw new Error((path + "does not exist or is not writeable"));
        }
    }

    confirmFilesExist() {
        this.confirmFileExists(this.appBuildGradlePath);
        this.confirmFileExists(this.gradleWrapperPropertiesPath);
        this.confirmFileExists(this.buildGradlePath);
        this.confirmFileExists(this.gradleWrapperPropertiesPath);
    }

    fixAppBuildGradle() {
        const fix = new DocFix(this.appBuildGradlePath);
        fix.backup();

        fix.advanceTo(/^android\s*\{$/);
        fix.advanceTo(/^\s+compileSdkVersion\s/);
    
        let versionMatch = /compileSdkVersion\s+(\d+)/.exec(fix.currentLine);
        if (versionMatch && versionMatch.length > 1) {
            let version = parseInt(versionMatch[1]);
            if (version >= 28) {
                throw new Error(("compileSdkVersion is >= 28, looks like android/app/build.gradle" +
                                 " may already be fixed. No changes made.\n"));
            }
        }
    
        fix.editCurrentLine(/compileSdkVersion\s.*$/, "compileSdkVersion 28");
    
        fix.advanceTo(/^\s+defaultConfig\s+\{$/);
        fix.advanceTo(/^\s+targetSdkVersion\s/);
        fix.editCurrentLine(/targetSdkVersion\s.*$/, "targetSdkVersion 28");
    
        fix.advanceTo(/android\.support\.test\.runner\.AndroidJUnitRunner/);
        fix.editCurrentLine(/android\.support\.test\.runner\.AndroidJUnitRunner/,
                            "androidx.test.runner.AndroidJUnitRunner");
    
        fix.advanceTo(/^dependencies\s+\{$/);
        fix.advanceTo(/com\.android\.support\.test:runner:/);
        fix.editCurrentLine(/com\.android\.support\.test:runner:[\d\.]+/,
                            "androidx.test.runner:1.1.1");
    
        fix.advanceTo(/com\.android\.support\.test\.espresso:espresso-core:/);
        fix.editCurrentLine(/com\.android\.support\.test\.espresso:espresso-core:[\d\.]+/,
                            "androidx.test.espresso:espresso-core:3.1.1");

        fix.finish();

        // any errors would have thrown an exception, so we can write here.
        fix.write();
    }

    fixGradleWrapperProperties() {
        const fix = new DocFix(this.gradleWrapperPropertiesPath);
        fix.backup();
        fix.advanceTo(/^distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle/);
        fix.editCurrentLine(/\/distributions\/gradle.*$/, "/distributions/gradle-4.10.1-all.zip");
        fix.finish();
        fix.write();
    }

    fixBuildGradle() {
        const fix = new DocFix(this.buildGradlePath);
        fix.backup();
        fix.advanceTo(/^\s+dependencies\s*\{/);
        fix.advanceTo(/^\s+classpath\s+['"]?com\.android\.tools\.build:gradle:/);
        fix.editCurrentLine(/classpath.*$/, "classpath 'com.android.tools.build:gradle:3.3.0'");
        fix.finish();
        fix.write();
    }

    fixGradleProperties() {
        const fix = new DocFix(this.gradlePropertiesPath);
        fix.backup();
        fix.finish();
        fix.appendLine("android.enableJetifier=true");
        fix.appendLine("android.useAndroidX=true");
        fix.write();
    }

    revert() {
        const files = [
            this.appBuildGradlePath,
            this.gradleWrapperPropertiesPath,
            this.buildGradlePath,
            this.gradlePropertiesPath];
        for (let i = 0; i< files.length; i++) {
            let filePath = files[i];
            let backupPath = filePath + ".ORIG";
            try {
                fs.accessSync(backupPath, fs.constants.R_OK);
                fs.copyFileSync(backupPath, filePath);
                fs.unlinkSync(backupPath);
            } catch (err) {
                // error before deleting backup should leave it in place
            }
        }
    }

    cleanup() {
        const files = [
            this.appBuildGradlePath,
            this.gradleWrapperPropertiesPath,
            this.buildGradlePath,
            this.gradlePropertiesPath];
        for (let i = 0; i< files.length; i++) {
            let filePath = files[i];
            let backupPath = filePath + ".ORIG";
            try {
                fs.unlinkSync(backupPath);
            } catch (err) {
                // error before deleting backup should leave it in place
            }
        }
    }

    execute() {
        try {
            this.confirmFilesExist();
            this.fixAppBuildGradle();
            this.fixGradleWrapperProperties();
            this.fixBuildGradle();
            this.fixGradleProperties();
        } catch (err) {
            this.revert();
            throw err;
        }
        this.cleanup();
    }

}
